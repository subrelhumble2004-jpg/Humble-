const { pool } = require("../config/db");

/**
 * Generates a daily queue number for a department.
 *
 * Example:
 * GM-001
 * GM-002
 * CARD-003
 *
 * The department prefix is generated from the department name,
 * so no `departments.code` column is required.
 */
async function generateQueueNumber(departmentId) {
  const [[department]] = await pool.query(
    `
    SELECT name
    FROM departments
    WHERE id = ?
    LIMIT 1
    `,
    [departmentId]
  );

  if (!department) {
    throw new Error("Department not found while generating queue number.");
  }

  // Generate a short department prefix from the department name.
  const prefix = department.name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);

  const safePrefix = prefix || "GEN";

  const [[result]] = await pool.query(
    `
    SELECT COUNT(*) AS count
    FROM queue_tickets
    WHERE department_id = ?
      AND queue_date = CURDATE()
    `,
    [departmentId]
  );

  const nextSequence = Number(result.count || 0) + 1;

  const paddedNumber = String(nextSequence).padStart(3, "0");

  return `${safePrefix}-${paddedNumber}`;
}

module.exports = generateQueueNumber;
