const { pool } = require("../config/db");
const { ApiError } = require("../middleware/errorHandler");

// @route GET /api/queue/:departmentId  (live queue for a department, today)
async function getDepartmentQueue(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT a.id AS appointmentId, a.queue_number AS queueNumber, a.status,
              a.appointment_time AS time, up.full_name AS patientName, ud.full_name AS doctorName
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN users up ON up.id = p.user_id
       JOIN doctors doc ON doc.id = a.doctor_id
       JOIN users ud ON ud.id = doc.user_id
       WHERE a.department_id = ? AND a.appointment_date = CURDATE()
         AND a.status NOT IN ('cancelled')
       ORDER BY a.appointment_time ASC`,
      [req.params.departmentId]
    );

    const current = rows.find((r) => r.status === "in_session") || null;
    const waiting = rows.filter((r) => r.status === "confirmed" || r.status === "pending");
    const completed = rows.filter((r) => r.status === "completed");

    res.json({
      success: true,
      data: {
        queue: rows,
        currentlyServing: current,
        waitingCount: waiting.length,
        completedCount: completed.length,
        estimatedWaitMinutes: waiting.length * 12,
      },
    });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/queue/appointment/:appointmentId/position
async function getMyQueuePosition(req, res, next) {
  try {
    const [[appt]] = await pool.query("SELECT * FROM appointments WHERE id = ?", [req.params.appointmentId]);
    if (!appt) throw new ApiError(404, "Appointment not found");

    const [ahead] = await pool.query(
      `SELECT COUNT(*) AS count FROM appointments
       WHERE department_id = ? AND appointment_date = ? AND appointment_time < ?
         AND status IN ('confirmed','pending','in_session')`,
      [appt.department_id, appt.appointment_date, appt.appointment_time]
    );

    res.json({
      success: true,
      data: {
        queueNumber: appt.queue_number,
        status: appt.status,
        patientsAhead: ahead[0].count,
        estimatedWaitMinutes: ahead[0].count * 12,
      },
    });
  } catch (err) {
    next(err);
  }
}

// @route PATCH /api/queue/:appointmentId/advance  (doctor/admin: call next patient)
async function advanceQueue(req, res, next) {
  try {
    const [[appt]] = await pool.query("SELECT * FROM appointments WHERE id = ?", [req.params.appointmentId]);
    if (!appt) throw new ApiError(404, "Appointment not found");

    // complete current, then set next confirmed appointment (same doctor, same day) to in_session
    await pool.query("UPDATE appointments SET status = 'completed' WHERE id = ?", [appt.id]);
    await pool.query("UPDATE queue_log SET status = 'completed' WHERE appointment_id = ?", [appt.id]);

    const [[next]] = await pool.query(
      `SELECT id FROM appointments
       WHERE doctor_id = ? AND appointment_date = ? AND status = 'confirmed'
       ORDER BY appointment_time ASC LIMIT 1`,
      [appt.doctor_id, appt.appointment_date]
    );
    if (next) {
      await pool.query("UPDATE appointments SET status = 'in_session' WHERE id = ?", [next.id]);
      await pool.query("UPDATE queue_log SET status = 'in_session' WHERE appointment_id = ?", [next.id]);
    }

    res.json({ success: true, message: "Queue advanced", data: { completedId: appt.id, nowServingId: next ? next.id : null } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDepartmentQueue, getMyQueuePosition, advanceQueue };
