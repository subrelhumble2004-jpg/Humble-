const { pool } = require("../config/db");

// @route GET /api/admin/stats
async function getDashboardStats(req, res, next) {
  try {
    const [[patients]] = await pool.query("SELECT COUNT(*) AS count FROM users WHERE role = 'patient'");
    const [[doctors]] = await pool.query("SELECT COUNT(*) AS count FROM doctors");
    const [[apptsThisWeek]] = await pool.query(
      "SELECT COUNT(*) AS count FROM appointments WHERE appointment_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
    );
    const [[missed]] = await pool.query("SELECT COUNT(*) AS count FROM appointments WHERE status = 'missed'");

    const [weeklyTrend] = await pool.query(`
      SELECT DATE_FORMAT(appointment_date, '%a') AS day, COUNT(*) AS appointments
      FROM appointments
      WHERE appointment_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY appointment_date
      ORDER BY appointment_date ASC
    `);

    const [departmentSplit] = await pool.query(`
      SELECT dept.name, COUNT(*) AS value
      FROM appointments a JOIN departments dept ON dept.id = a.department_id
      WHERE a.appointment_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY dept.name
      ORDER BY value DESC
      LIMIT 6
    `);

    res.json({
      success: true,
      data: {
        totalPatients: patients.count,
        activeDoctors: doctors.count,
        appointmentsThisWeek: apptsThisWeek.count,
        missedVisits: missed.count,
        weeklyTrend,
        departmentSplit,
      },
    });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/admin/patients
async function getAllPatients(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT p.id, u.full_name AS name, u.email, u.phone, p.gender, p.date_of_birth AS dob, u.created_at AS registeredAt
      FROM patients p JOIN users u ON u.id = p.user_id
      ORDER BY u.created_at DESC
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    next(err);
  }
}

// @route PATCH /api/admin/users/:id/deactivate
async function deactivateUser(req, res, next) {
  try {
    await pool.query("UPDATE users SET is_active = FALSE WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "User deactivated" });
  } catch (err) {
    next(err);
  }
}

// @route PATCH /api/admin/users/:id/activate
async function activateUser(req, res, next) {
  try {
    await pool.query("UPDATE users SET is_active = TRUE WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "User activated" });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/admin/audit-logs
async function getAuditLogs(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT al.*, u.full_name AS actorName FROM audit_logs al
      LEFT JOIN users u ON u.id = al.actor_id
      ORDER BY al.created_at DESC LIMIT 200
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboardStats, getAllPatients, deactivateUser, activateUser, getAuditLogs };
