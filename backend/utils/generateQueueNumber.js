const { pool } = require("../config/db");

/**
 * Generates a daily, per-department sequential queue number, e.g. "CARD-014".
 * Resets automatically each day since it counts only today's appointments
 * for that department.
 */
async function generateQueueNumber(departmentId, departmentCode) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count FROM appointments
     WHERE department_id = ? AND DATE(appointment_date) = CURDATE()`,
    [departmentId]
  );
  const nextSeq = (rows[0].count || 0) + 1;
  const padded = String(nextSeq).padStart(3, "0");
  return `${departmentCode}-${padded}`;
}

module.exports = generateQueueNumber;
