const { pool } = require("../config/db");

// @route GET /api/admin/stats
async function getDashboardStats(req, res, next) {
  try {
    const [[patients]] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM users
      WHERE role = 'patient'
    `);

    const [[doctors]] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM doctors
      WHERE availability_status != 'on_leave'
    `);

    const [[apptsThisWeek]] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM appointments
      WHERE appointment_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        AND appointment_date <= CURDATE()
        AND status != 'cancelled'
    `);

    const [[missed]] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM appointments
      WHERE status = 'no_show'
    `);

    const [weeklyTrend] = await pool.query(`
      SELECT
        DATE_FORMAT(appointment_date, '%a') AS day,
        appointment_date,
        COUNT(*) AS appointments
      FROM appointments
      WHERE appointment_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        AND appointment_date <= CURDATE()
      GROUP BY appointment_date
      ORDER BY appointment_date ASC
    `);

    const [departmentSplit] = await pool.query(`
      SELECT
        dept.name,
        COUNT(*) AS value
      FROM appointments a
      INNER JOIN departments dept
        ON dept.id = a.department_id
      WHERE a.appointment_date >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
        AND a.appointment_date <= CURDATE()
        AND a.status != 'cancelled'
      GROUP BY dept.id, dept.name
      ORDER BY value DESC
      LIMIT 6
    `);

    res.json({
      success: true,
      data: {
        totalPatients: Number(patients.count),
        activeDoctors: Number(doctors.count),
        appointmentsThisWeek: Number(apptsThisWeek.count),
        missedVisits: Number(missed.count),
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
      SELECT
        id,
        full_name AS name,
        email,
        phone,
        gender,
        date_of_birth AS dob,
        address,
        is_active AS isActive,
        created_at AS registeredAt
      FROM users
      WHERE role = 'patient'
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    next(err);
  }
}


// @route PATCH /api/admin/users/:id/deactivate
async function deactivateUser(req, res, next) {
  try {
    const [result] = await pool.query(
      `
      UPDATE users
      SET is_active = FALSE
      WHERE id = ?
      `,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (err) {
    next(err);
  }
}


// @route PATCH /api/admin/users/:id/activate
async function activateUser(req, res, next) {
  try {
    const [result] = await pool.query(
      `
      UPDATE users
      SET is_active = TRUE
      WHERE id = ?
      `,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User activated successfully",
    });
  } catch (err) {
    next(err);
  }
}


// @route GET /api/admin/audit-logs
//
// The current database schema does not contain an audit_logs table.
// Instead of crashing the entire admin dashboard, return an empty
// list until audit logging is implemented.
async function getAuditLogs(req, res, next) {
  try {
    res.json({
      success: true,
      count: 0,
      data: [],
      message: "Audit logging is not configured yet.",
    });
  } catch (err) {
    next(err);
  }
}


module.exports = {
  getDashboardStats,
  getAllPatients,
  deactivateUser,
  activateUser,
  getAuditLogs,
};
