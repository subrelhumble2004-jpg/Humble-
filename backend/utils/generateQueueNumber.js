const { pool } = require("../config/db");

/**
 * Generate a queue ticket number for a department and specific date.
 *
 * @param {number} departmentId
 * @param {string} queueDate - YYYY-MM-DD
 * @param {object} connection - Optional MySQL connection/transaction
 */
async function generateQueueNumber(
  departmentId,
  queueDate,
  connection = pool
) {
  const [[department]] = await connection.query(
    `
    SELECT name
    FROM departments
    WHERE id = ?
    LIMIT 1
    `,
    [departmentId]
  );

  if (!department) {
    throw new Error(
      "Department not found while generating queue number."
    );
  }

  // Create a short prefix from the department name.
  const prefix = department.name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);

  const safePrefix = prefix || "GEN";

  // Count queue tickets for the ACTUAL queue date.
  const [[result]] = await connection.query(
    `
    SELECT COUNT(*) AS count
    FROM queue_tickets
    WHERE department_id = ?
      AND queue_date = ?
    `,
    [departmentId, queueDate]
  );

  const nextSequence = Number(result.count || 0) + 1;

  const paddedNumber = String(nextSequence).padStart(3, "0");

  return `${safePrefix}-${paddedNumber}`;
}

module.exports = generateQueueNumber;
