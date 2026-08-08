const { pool } = require("../config/db");
const { ApiError } = require("../middleware/errorHandler");
const generateQueueNumber = require("../utils/generateQueueNumber");
const { sendAppointmentConfirmation } = require("../config/mailer");

const APPT_SELECT = `
  SELECT a.id, a.queue_number AS queueNumber, a.appointment_date AS date, a.appointment_time AS time,
         a.reason, a.status, a.created_at AS createdAt,
         p.id AS patientId, up.full_name AS patientName, up.email AS patientEmail,
         doc.id AS doctorId, ud.full_name AS doctorName,
         dept.id AS departmentId, dept.name AS department, dept.code AS departmentCode
  FROM appointments a
  JOIN patients p ON p.id = a.patient_id
  JOIN users up ON up.id = p.user_id
  JOIN doctors doc ON doc.id = a.doctor_id
  JOIN users ud ON ud.id = doc.user_id
  JOIN departments dept ON dept.id = a.department_id
`;

// @route POST /api/appointments  (patient books an appointment)
async function bookAppointment(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { doctorId, departmentId, date, time, reason } = req.body;
    if (!doctorId || !departmentId || !date || !time) {
      throw new ApiError(400, "doctorId, departmentId, date and time are required");
    }

    const [[patient]] = await conn.query("SELECT id FROM patients WHERE user_id = ?", [req.user.id]);
    if (!patient) throw new ApiError(404, "Patient profile not found for this account");

    const [[dept]] = await conn.query("SELECT id, code FROM departments WHERE id = ?", [departmentId]);
    if (!dept) throw new ApiError(404, "Department not found");

    // prevent double-booking the same doctor/date/time
    const [clash] = await conn.query(
      "SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status NOT IN ('cancelled','missed')",
      [doctorId, date, time]
    );
    if (clash.length) throw new ApiError(409, "This time slot is already booked. Please choose another.");

    const queueNumber = await generateQueueNumber(departmentId, dept.code);

    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO appointments (patient_id, doctor_id, department_id, queue_number, appointment_date, appointment_time, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
      [patient.id, doctorId, departmentId, queueNumber, date, time, reason || null]
    );
    await conn.query(
      "INSERT INTO queue_log (appointment_id, status, position) VALUES (?, 'waiting', ?)",
      [result.insertId, 0]
    );
    await conn.commit();

    const [[full]] = await pool.query(APPT_SELECT + " WHERE a.id = ?", [result.insertId]);

    // Fire-and-forget confirmation email — do not block the response on SMTP latency/failures
    sendAppointmentConfirmation({
      to: full.patientEmail,
      name: full.patientName,
      queueNumber: full.queueNumber,
      doctorName: full.doctorName,
      department: full.department,
      date: full.date,
      time: full.time,
    }).catch((e) => console.error("Email send failed:", e.message));

    res.status(201).json({ success: true, message: "Appointment booked successfully", data: full });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

// @route GET /api/appointments/me  (patient's own appointments)
async function getMyAppointments(req, res, next) {
  try {
    const [[patient]] = await pool.query("SELECT id FROM patients WHERE user_id = ?", [req.user.id]);
    if (!patient) throw new ApiError(404, "Patient profile not found");
    const [rows] = await pool.query(APPT_SELECT + " WHERE a.patient_id = ? ORDER BY a.appointment_date DESC, a.appointment_time DESC", [patient.id]);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/appointments/doctor/:doctorId  (doctor's schedule)
async function getDoctorAppointments(req, res, next) {
  try {
    const { date } = req.query;
    let query = APPT_SELECT + " WHERE a.doctor_id = ?";
    const params = [req.params.doctorId];
    if (date) { query += " AND a.appointment_date = ?"; params.push(date); }
    query += " ORDER BY a.appointment_time ASC";
    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/appointments  (admin: all appointments, filterable)
async function getAllAppointments(req, res, next) {
  try {
    const { status, department, date } = req.query;
    let query = APPT_SELECT + " WHERE 1=1";
    const params = [];
    if (status) { query += " AND a.status = ?"; params.push(status); }
    if (department) { query += " AND dept.name = ?"; params.push(department); }
    if (date) { query += " AND a.appointment_date = ?"; params.push(date); }
    query += " ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT 500";
    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    next(err);
  }
}

// @route PATCH /api/appointments/:id/cancel
async function cancelAppointment(req, res, next) {
  try {
    const [[appt]] = await pool.query(
      `SELECT a.*, p.user_id AS patientUserId FROM appointments a JOIN patients p ON p.id = a.patient_id WHERE a.id = ?`,
      [req.params.id]
    );
    if (!appt) throw new ApiError(404, "Appointment not found");
    if (req.user.role === "patient" && appt.patientUserId !== req.user.id) {
      throw new ApiError(403, "You can only cancel your own appointments");
    }
    await pool.query("UPDATE appointments SET status = 'cancelled' WHERE id = ?", [req.params.id]);
    await pool.query("UPDATE queue_log SET status = 'missed' WHERE appointment_id = ?", [req.params.id]);
    res.json({ success: true, message: "Appointment cancelled" });
  } catch (err) {
    next(err);
  }
}

// @route PATCH /api/appointments/:id/reschedule
async function rescheduleAppointment(req, res, next) {
  try {
    const { date, time } = req.body;
    if (!date || !time) throw new ApiError(400, "date and time are required");
    const [[appt]] = await pool.query(
      `SELECT a.*, p.user_id AS patientUserId FROM appointments a JOIN patients p ON p.id = a.patient_id WHERE a.id = ?`,
      [req.params.id]
    );
    if (!appt) throw new ApiError(404, "Appointment not found");
    if (req.user.role === "patient" && appt.patientUserId !== req.user.id) {
      throw new ApiError(403, "You can only reschedule your own appointments");
    }
    const [clash] = await pool.query(
      "SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND id != ? AND status NOT IN ('cancelled','missed')",
      [appt.doctor_id, date, time, req.params.id]
    );
    if (clash.length) throw new ApiError(409, "This time slot is already booked. Please choose another.");

    await pool.query("UPDATE appointments SET appointment_date = ?, appointment_time = ?, status = 'confirmed' WHERE id = ?", [date, time, req.params.id]);
    res.json({ success: true, message: "Appointment rescheduled" });
  } catch (err) {
    next(err);
  }
}

// @route PATCH /api/appointments/:id/status  (doctor/admin updates status)
async function updateAppointmentStatus(req, res, next) {
  try {
    const { status } = req.body; // pending | confirmed | in_session | completed | cancelled | missed
    const valid = ["pending", "confirmed", "in_session", "completed", "cancelled", "missed"];
    if (!valid.includes(status)) throw new ApiError(400, "Invalid status value");
    await pool.query("UPDATE appointments SET status = ? WHERE id = ?", [status, req.params.id]);
    const logStatus = { in_session: "in_session", completed: "completed", cancelled: "missed", missed: "missed" }[status] || "waiting";
    await pool.query("UPDATE queue_log SET status = ? WHERE appointment_id = ?", [logStatus, req.params.id]);
    res.json({ success: true, message: "Appointment status updated" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  bookAppointment, getMyAppointments, getDoctorAppointments, getAllAppointments,
  cancelAppointment, rescheduleAppointment, updateAppointmentStatus,
};
