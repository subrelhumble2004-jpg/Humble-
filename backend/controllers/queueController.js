const { pool } = require("../config/db");
const { ApiError } = require("../middleware/errorHandler");

// GET /api/queue/:departmentId
// Returns today's live queue for a department.
async function getDepartmentQueue(req, res, next) {
  try {
    const departmentId = req.params.departmentId;

    const [rows] = await pool.query(`
      SELECT
        qt.id AS queueTicketId,
        qt.appointment_id AS appointmentId,
        qt.ticket_number AS queueNumber,
        qt.queue_position AS queuePosition,
        qt.status AS queueStatus,
        qt.estimated_wait_minutes AS estimatedWaitMinutes,
        a.appointment_date AS appointmentDate,
        a.appointment_time AS appointmentTime,
        a.status AS appointmentStatus,
        patient.id AS patientId,
        patient.full_name AS patientName,
        doctor.id AS doctorId,
        doctor.full_name AS doctorName,
        d.name AS departmentName
      FROM queue_tickets qt
      LEFT JOIN appointments a
        ON a.id = qt.appointment_id
      INNER JOIN users patient
        ON patient.id = qt.patient_id
      LEFT JOIN doctors doc
        ON doc.id = qt.doctor_id
      LEFT JOIN users doctor
        ON doctor.id = doc.user_id
      INNER JOIN departments d
        ON d.id = qt.department_id
      WHERE qt.department_id = ?
        AND qt.queue_date = CURDATE()
        AND qt.status NOT IN ('cancelled')
      ORDER BY
        CASE qt.status
          WHEN 'serving' THEN 1
          WHEN 'called' THEN 2
          WHEN 'waiting' THEN 3
          WHEN 'skipped' THEN 4
          WHEN 'completed' THEN 5
          ELSE 6
        END,
        qt.queue_position ASC
    `, [departmentId]);

    const currentlyServing =
      rows.find((row) => row.queueStatus === "serving") ||
      rows.find((row) => row.queueStatus === "called") ||
      null;

    const waiting = rows.filter(
      (row) => row.queueStatus === "waiting"
    );

    const completed = rows.filter(
      (row) => row.queueStatus === "completed"
    );

    res.json({
      success: true,
      data: {
        queue: rows,
        currentlyServing,
        waitingCount: waiting.length,
        completedCount: completed.length,
        estimatedWaitMinutes: waiting.length * 10
      }
    });
  } catch (err) {
    next(err);
  }
}


// GET /api/queue/appointment/:appointmentId/position
async function getMyQueuePosition(req, res, next) {
  try {
    const appointmentId = req.params.appointmentId;

    const [[ticket]] = await pool.query(`
      SELECT
        qt.id,
        qt.appointment_id AS appointmentId,
        qt.patient_id AS patientId,
        qt.doctor_id AS doctorId,
        qt.department_id AS departmentId,
        qt.ticket_number AS queueNumber,
        qt.queue_date AS queueDate,
        qt.queue_position AS queuePosition,
        qt.status,
        qt.estimated_wait_minutes AS estimatedWaitMinutes,
        a.appointment_date AS appointmentDate,
        a.appointment_time AS appointmentTime
      FROM queue_tickets qt
      LEFT JOIN appointments a
        ON a.id = qt.appointment_id
      WHERE qt.appointment_id = ?
      LIMIT 1
    `, [appointmentId]);

    if (!ticket) {
      throw new ApiError(404, "Queue ticket not found");
    }

    // Make sure a patient can only view their own queue ticket.
    if (
      req.user.role === "patient" &&
      Number(ticket.patientId) !== Number(req.user.id)
    ) {
      throw new ApiError(403, "You do not have permission to view this queue ticket");
    }

    // Count active patients ahead in the same department/day.
    const [[ahead]] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM queue_tickets
      WHERE department_id = ?
        AND queue_date = ?
        AND queue_position < ?
        AND status IN ('waiting', 'called', 'serving')
    `, [
      ticket.departmentId,
      ticket.queueDate,
      ticket.queuePosition
    ]);

    const patientsAhead = Number(ahead.count || 0);

    res.json({
      success: true,
      data: {
        queueNumber: ticket.queueNumber,
        queuePosition: ticket.queuePosition,
        status: ticket.status,
        patientsAhead,
        estimatedWaitMinutes: patientsAhead * 10,
        appointmentId: ticket.appointmentId,
        appointmentDate: ticket.appointmentDate,
        appointmentTime: ticket.appointmentTime
      }
    });
  } catch (err) {
    next(err);
  }
}


// PATCH /api/queue/:appointmentId/advance
// Doctor/admin: complete current ticket and call the next waiting patient.
async function advanceQueue(req, res, next) {
  let connection;

  try {
    connection = await pool.getConnection();

    await connection.beginTransaction();

    const [[current]] = await connection.query(`
      SELECT
        qt.id AS queueTicketId,
        qt.appointment_id AS appointmentId,
        qt.doctor_id AS doctorId,
        qt.department_id AS departmentId,
        qt.queue_date AS queueDate,
        qt.status AS queueStatus,
        a.status AS appointmentStatus
      FROM queue_tickets qt
      LEFT JOIN appointments a
        ON a.id = qt.appointment_id
      WHERE qt.appointment_id = ?
      LIMIT 1
      FOR UPDATE
    `, [req.params.appointmentId]);

    if (!current) {
      throw new ApiError(404, "Queue ticket not found");
    }

    // A doctor may only advance their own queue.
    if (
      req.user.role === "doctor"
    ) {
      const [[doctor]] = await connection.query(
        `SELECT id FROM doctors WHERE user_id = ? LIMIT 1`,
        [req.user.id]
      );

      if (
        !doctor ||
        Number(doctor.id) !== Number(current.doctorId)
      ) {
        throw new ApiError(
          403,
          "You can only manage your own queue"
        );
      }
    }

    // Complete the current queue ticket.
    await connection.query(`
      UPDATE queue_tickets
      SET
        status = 'completed',
        completed_at = COALESCE(completed_at, NOW()),
        estimated_wait_minutes = 0
      WHERE id = ?
    `, [current.queueTicketId]);

    // Complete the linked appointment.
    if (current.appointmentId) {
      await connection.query(`
        UPDATE appointments
        SET status = 'completed'
        WHERE id = ?
      `, [current.appointmentId]);
    }

    // Find the next waiting patient for the same doctor and day.
    const [[next]] = await connection.query(`
      SELECT
        qt.id AS queueTicketId,
        qt.appointment_id AS appointmentId,
        qt.patient_id AS patientId
      FROM queue_tickets qt
      WHERE qt.doctor_id = ?
        AND qt.department_id = ?
        AND qt.queue_date = ?
        AND qt.status = 'waiting'
      ORDER BY qt.queue_position ASC
      LIMIT 1
      FOR UPDATE
    `, [
      current.doctorId,
      current.departmentId,
      current.queueDate
    ]);

    let nowServingId = null;

    if (next) {
      await connection.query(`
        UPDATE queue_tickets
        SET
          status = 'serving',
          called_at = COALESCE(called_at, NOW()),
          estimated_wait_minutes = 0
        WHERE id = ?
      `, [next.queueTicketId]);

      if (next.appointmentId) {
        await connection.query(`
          UPDATE appointments
          SET status = 'confirmed'
          WHERE id = ?
            AND status IN ('pending', 'confirmed')
        `, [next.appointmentId]);
      }

      nowServingId = next.appointmentId;
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Queue advanced successfully",
      data: {
        completedId: current.appointmentId,
        nowServingId
      }
    });
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {}
    }

    next(err);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}


module.exports = {
  getDepartmentQueue,
  getMyQueuePosition,
  advanceQueue
};
