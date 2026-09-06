const { pool } = require("../config/db");
const { ApiError } = require("../middleware/errorHandler");
const generateQueueNumber = require("../utils/generateQueueNumber");
const { sendAppointmentConfirmation } = require("../config/mailer");

const APPT_SELECT = `
  SELECT
    a.id,
    qt.ticket_number AS queueNumber,
    a.appointment_date AS date,
    a.appointment_time AS time,
    a.reason,
    a.status,
    a.notes,
    a.created_at AS createdAt,

    u.id AS patientId,
    u.full_name AS patientName,
    u.email AS patientEmail,
    u.phone AS patientPhone,

    doc.id AS doctorId,
    ud.full_name AS doctorName,
    doc.specialization,

    dept.id AS departmentId,
    dept.name AS department,
    dept.location AS departmentLocation,

    qt.id AS queueTicketId,
    qt.queue_position AS queuePosition,
    qt.status AS queueStatus,
    qt.estimated_wait_minutes AS estimatedWaitMinutes

  FROM appointments a

  INNER JOIN users u
    ON u.id = a.patient_id

  INNER JOIN doctors doc
    ON doc.id = a.doctor_id

  INNER JOIN users ud
    ON ud.id = doc.user_id

  INNER JOIN departments dept
    ON dept.id = a.department_id

  LEFT JOIN queue_tickets qt
    ON qt.appointment_id = a.id
`;


/**
 * POST /api/appointments
 * Patient books an appointment.
 */
async function bookAppointment(req, res, next) {
  const conn = await pool.getConnection();

  try {
    const {
      doctorId,
      departmentId,
      date,
      time,
      reason,
    } = req.body;

    if (!doctorId || !departmentId || !date || !time) {
      throw new ApiError(
        400,
        "doctorId, departmentId, date and time are required"
      );
    }

    await conn.beginTransaction();

    // Make sure the logged-in user is actually a patient.
    const [[patient]] = await conn.query(
      `
      SELECT id, full_name, email, phone
      FROM users
      WHERE id = ?
        AND role = 'patient'
        AND is_active = TRUE
      LIMIT 1
      `,
      [req.user.id]
    );

    if (!patient) {
      throw new ApiError(
        404,
        "Patient account not found or inactive"
      );
    }

    // Verify department.
    const [[department]] = await conn.query(
      `
      SELECT id, name
      FROM departments
      WHERE id = ?
        AND is_active = TRUE
      LIMIT 1
      `,
      [departmentId]
    );

    if (!department) {
      throw new ApiError(404, "Department not found or inactive");
    }

    // Verify doctor and make sure the doctor belongs to the selected department.
    const [[doctor]] = await conn.query(
      `
      SELECT
        d.id,
        d.department_id,
        d.availability_status,
        u.full_name AS doctorName
      FROM doctors d
      INNER JOIN users u
        ON u.id = d.user_id
      WHERE d.id = ?
        AND d.department_id = ?
        AND u.is_active = TRUE
      LIMIT 1
      `,
      [doctorId, departmentId]
    );

    if (!doctor) {
      throw new ApiError(
        404,
        "Doctor not found or does not belong to the selected department"
      );
    }

    if (doctor.availability_status !== "available") {
      throw new ApiError(
        409,
        "This doctor is currently unavailable"
      );
    }

    // Prevent double booking.
    const [clash] = await conn.query(
      `
      SELECT id
      FROM appointments
      WHERE doctor_id = ?
        AND appointment_date = ?
        AND appointment_time = ?
        AND status NOT IN ('cancelled', 'no_show')
      LIMIT 1
      `,
      [doctorId, date, time]
    );

    if (clash.length > 0) {
      throw new ApiError(
        409,
        "This time slot is already booked. Please choose another."
      );
    }

    /*
     * Generate today's queue ticket.
     *
     * We intentionally generate the ticket after validating
     * the patient, department and doctor.
     */
    const queueNumber = await generateQueueNumber(
      departmentId,
      department.name
    );

    // Create appointment.
    const [appointmentResult] = await conn.query(
      `
      INSERT INTO appointments (
        patient_id,
        doctor_id,
        department_id,
        appointment_date,
        appointment_time,
        reason,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, 'confirmed')
      `,
      [
        patient.id,
        doctorId,
        departmentId,
        date,
        time,
        reason || null,
      ]
    );

    const appointmentId = appointmentResult.insertId;

    // Calculate current queue position for this department/date.
    const [[queueCount]] = await conn.query(
      `
      SELECT COUNT(*) AS count
      FROM queue_tickets
      WHERE department_id = ?
        AND queue_date = ?
        AND status IN ('waiting', 'called', 'serving')
      `,
      [departmentId, date]
    );

    const queuePosition = Number(queueCount.count) + 1;

    // Create queue ticket.
    await conn.query(
      `
      INSERT INTO queue_tickets (
        appointment_id,
        patient_id,
        doctor_id,
        department_id,
        ticket_number,
        queue_date,
        queue_position,
        status,
        estimated_wait_minutes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting', ?)
      `,
      [
        appointmentId,
        patient.id,
        doctorId,
        departmentId,
        queueNumber,
        date,
        queuePosition,
        queuePosition * 10,
      ]
    );

    await conn.commit();

    // Fetch complete appointment after transaction succeeds.
    const [[full]] = await pool.query(
      APPT_SELECT + " WHERE a.id = ? LIMIT 1",
      [appointmentId]
    );

    // Email failure should not make a successful booking fail.
    sendAppointmentConfirmation({
      to: full.patientEmail,
      name: full.patientName,
      queueNumber: full.queueNumber,
      doctorName: full.doctorName,
      department: full.department,
      date: full.date,
      time: full.time,
    }).catch((error) => {
      console.error(
        "Appointment confirmation email failed:",
        error.message
      );
    });

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: full,
    });

  } catch (err) {
    try {
      await conn.rollback();
    } catch (_) {}

    next(err);
  } finally {
    conn.release();
  }
}


/**
 * GET /api/appointments/me
 * Patient's own appointments.
 */
async function getMyAppointments(req, res, next) {
  try {
    const [[patient]] = await pool.query(
      `
      SELECT id
      FROM users
      WHERE id = ?
        AND role = 'patient'
      LIMIT 1
      `,
      [req.user.id]
    );

    if (!patient) {
      throw new ApiError(404, "Patient account not found");
    }

    const [rows] = await pool.query(
      APPT_SELECT +
        `
        WHERE a.patient_id = ?
        ORDER BY
          a.appointment_date DESC,
          a.appointment_time DESC
        `,
      [patient.id]
    );

    res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    next(err);
  }
}


/**
 * GET /api/appointments/doctor/:doctorId
 * Doctor's appointment schedule.
 */
async function getDoctorAppointments(req, res, next) {
  try {
    const { date } = req.query;

    let query = APPT_SELECT + " WHERE a.doctor_id = ?";
    const params = [req.params.doctorId];

    if (date) {
      query += " AND a.appointment_date = ?";
      params.push(date);
    }

    query += `
      ORDER BY
        a.appointment_date ASC,
        a.appointment_time ASC
    `;

    const [rows] = await pool.query(query, params);

    res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    next(err);
  }
}


/**
 * GET /api/appointments
 * Admin: all appointments.
 */
async function getAllAppointments(req, res, next) {
  try {
    const {
      status,
      department,
      date,
    } = req.query;

    let query = APPT_SELECT + " WHERE 1 = 1";
    const params = [];

    if (status) {
      query += " AND a.status = ?";
      params.push(status);
    }

    if (department) {
      query += " AND dept.id = ?";
      params.push(department);
    }

    if (date) {
      query += " AND a.appointment_date = ?";
      params.push(date);
    }

    query += `
      ORDER BY
        a.appointment_date DESC,
        a.appointment_time DESC
      LIMIT 500
    `;

    const [rows] = await pool.query(query, params);

    res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    next(err);
  }
}


/**
 * PATCH /api/appointments/:id/cancel
 */
async function cancelAppointment(req, res, next) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [[appointment]] = await conn.query(
      `
      SELECT
        a.id,
        a.patient_id,
        a.status
      FROM appointments a
      WHERE a.id = ?
      LIMIT 1
      `,
      [req.params.id]
    );

    if (!appointment) {
      throw new ApiError(404, "Appointment not found");
    }

    if (
      req.user.role === "patient" &&
      Number(appointment.patient_id) !== Number(req.user.id)
    ) {
      throw new ApiError(
        403,
        "You can only cancel your own appointments"
      );
    }

    if (
      ["completed", "cancelled", "no_show"].includes(
        appointment.status
      )
    ) {
      throw new ApiError(
        409,
        "This appointment can no longer be cancelled"
      );
    }

    await conn.query(
      `
      UPDATE appointments
      SET status = 'cancelled'
      WHERE id = ?
      `,
      [req.params.id]
    );

    await conn.query(
      `
      UPDATE queue_tickets
      SET status = 'cancelled'
      WHERE appointment_id = ?
        AND status NOT IN ('completed', 'cancelled')
      `,
      [req.params.id]
    );

    await conn.commit();

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
    });

  } catch (err) {
    try {
      await conn.rollback();
    } catch (_) {}

    next(err);
  } finally {
    conn.release();
  }
}


/**
 * PATCH /api/appointments/:id/reschedule
 */
async function rescheduleAppointment(req, res, next) {
  const conn = await pool.getConnection();

  try {
    const { date, time } = req.body;

    if (!date || !time) {
      throw new ApiError(
        400,
        "date and time are required"
      );
    }

    await conn.beginTransaction();

    const [[appointment]] = await conn.query(
      `
      SELECT
        a.id,
        a.patient_id,
        a.doctor_id,
        a.status
      FROM appointments a
      WHERE a.id = ?
      LIMIT 1
      `,
      [req.params.id]
    );

    if (!appointment) {
      throw new ApiError(404, "Appointment not found");
    }

    if (
      req.user.role === "patient" &&
      Number(appointment.patient_id) !== Number(req.user.id)
    ) {
      throw new ApiError(
        403,
        "You can only reschedule your own appointments"
      );
    }

    if (
      ["completed", "cancelled", "no_show"].includes(
        appointment.status
      )
    ) {
      throw new ApiError(
        409,
        "This appointment cannot be rescheduled"
      );
    }

    const [clash] = await conn.query(
      `
      SELECT id
      FROM appointments
      WHERE doctor_id = ?
        AND appointment_date = ?
        AND appointment_time = ?
        AND id != ?
        AND status NOT IN ('cancelled', 'no_show')
      LIMIT 1
      `,
      [
        appointment.doctor_id,
        date,
        time,
        req.params.id,
      ]
    );

    if (clash.length > 0) {
      throw new ApiError(
        409,
        "This time slot is already booked. Please choose another."
      );
    }

    await conn.query(
      `
      UPDATE appointments
      SET
        appointment_date = ?,
        appointment_time = ?,
        status = 'confirmed'
      WHERE id = ?
      `,
      [
        date,
        time,
        req.params.id,
      ]
    );

    // Update queue ticket date and reset it to waiting.
    await conn.query(
      `
      UPDATE queue_tickets
      SET
        queue_date = ?,
        status = 'waiting',
        called_at = NULL,
        served_at = NULL,
        completed_at = NULL
      WHERE appointment_id = ?
      `,
      [
        date,
        req.params.id,
      ]
    );

    await conn.commit();

    res.json({
      success: true,
      message: "Appointment rescheduled successfully",
    });

  } catch (err) {
    try {
      await conn.rollback();
    } catch (_) {}

    next(err);
  } finally {
    conn.release();
  }
}


/**
 * PATCH /api/appointments/:id/status
 * Doctor/admin updates appointment status.
 */
async function updateAppointmentStatus(req, res, next) {
  try {
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "completed",
      "cancelled",
      "no_show",
    ];

    if (!validStatuses.includes(status)) {
      throw new ApiError(
        400,
        `Invalid status. Allowed values: ${validStatuses.join(", ")}`
      );
    }

    const [[appointment]] = await pool.query(
      `
      SELECT id
      FROM appointments
      WHERE id = ?
      LIMIT 1
      `,
      [req.params.id]
    );

    if (!appointment) {
      throw new ApiError(
        404,
        "Appointment not found"
      );
    }

    await pool.query(
      `
      UPDATE appointments
      SET status = ?
      WHERE id = ?
      `,
      [status, req.params.id]
    );

    // Keep queue ticket status synchronized.
    let queueStatus = "waiting";

    if (status === "completed") {
      queueStatus = "completed";
    } else if (status === "cancelled") {
      queueStatus = "cancelled";
    } else if (status === "no_show") {
      queueStatus = "skipped";
    } else if (status === "confirmed" || status === "pending") {
      queueStatus = "waiting";
    }

    await pool.query(
      `
      UPDATE queue_tickets
      SET status = ?
      WHERE appointment_id = ?
      `,
      [queueStatus, req.params.id]
    );

    res.json({
      success: true,
      message: "Appointment status updated successfully",
    });

  } catch (err) {
    next(err);
  }
}


module.exports = {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  getAllAppointments,
  cancelAppointment,
  rescheduleAppointment,
  updateAppointmentStatus,
};
