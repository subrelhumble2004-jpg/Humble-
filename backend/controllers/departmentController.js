const { pool } = require("../config/db");
const { ApiError } = require("../middleware/errorHandler");

// GET /api/departments
async function getAllDepartments(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        name,
        description,
        location,
        is_active AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM departments
      WHERE is_active = TRUE
      ORDER BY name ASC
    `);

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/departments/:id
async function getDepartment(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        name,
        description,
        location,
        is_active AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM departments
      WHERE id = ?
      LIMIT 1
    `, [req.params.id]);

    if (!rows.length) {
      throw new ApiError(404, "Department not found");
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/departments
async function createDepartment(req, res, next) {
  try {
    const {
      name,
      description,
      location
    } = req.body;

    if (!name || !name.trim()) {
      throw new ApiError(400, "Department name is required");
    }

    const cleanName = name.trim();

    // Prevent duplicate department names
    const [existing] = await pool.query(
      `SELECT id FROM departments WHERE LOWER(name) = LOWER(?) LIMIT 1`,
      [cleanName]
    );

    if (existing.length) {
      throw new ApiError(409, "A department with this name already exists");
    }

    const [result] = await pool.query(`
      INSERT INTO departments (
        name,
        description,
        location,
        is_active
      )
      VALUES (?, ?, ?, TRUE)
    `, [
      cleanName,
      description?.trim() || null,
      location?.trim() || null
    ]);

    const [rows] = await pool.query(`
      SELECT
        id,
        name,
        description,
        location,
        is_active AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM departments
      WHERE id = ?
      LIMIT 1
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/departments/:id
async function updateDepartment(req, res, next) {
  try {
    const departmentId = req.params.id;

    const {
      name,
      description,
      location,
      isActive
    } = req.body;

    // Check department exists
    const [existing] = await pool.query(
      `SELECT id FROM departments WHERE id = ? LIMIT 1`,
      [departmentId]
    );

    if (!existing.length) {
      throw new ApiError(404, "Department not found");
    }

    // If name is being changed, check for duplicates
    if (name !== undefined && name !== null && name.trim()) {
      const cleanName = name.trim();

      const [duplicate] = await pool.query(`
        SELECT id
        FROM departments
        WHERE LOWER(name) = LOWER(?)
          AND id != ?
        LIMIT 1
      `, [cleanName, departmentId]);

      if (duplicate.length) {
        throw new ApiError(409, "A department with this name already exists");
      }
    }

    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push("name = ?");
      values.push(name.trim());
    }

    if (description !== undefined) {
      fields.push("description = ?");
      values.push(description?.trim() || null);
    }

    if (location !== undefined) {
      fields.push("location = ?");
      values.push(location?.trim() || null);
    }

    if (isActive !== undefined) {
      fields.push("is_active = ?");
      values.push(Boolean(isActive));
    }

    if (!fields.length) {
      throw new ApiError(400, "No valid fields provided for update");
    }

    values.push(departmentId);

    await pool.query(`
      UPDATE departments
      SET ${fields.join(", ")}
      WHERE id = ?
    `, values);

    const [rows] = await pool.query(`
      SELECT
        id,
        name,
        description,
        location,
        is_active AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM departments
      WHERE id = ?
      LIMIT 1
    `, [departmentId]);

    res.json({
      success: true,
      message: "Department updated successfully",
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/departments/:id
async function deleteDepartment(req, res, next) {
  try {
    const departmentId = req.params.id;

    const [existing] = await pool.query(
      `SELECT id, name FROM departments WHERE id = ? LIMIT 1`,
      [departmentId]
    );

    if (!existing.length) {
      throw new ApiError(404, "Department not found");
    }

    // Check whether doctors are linked to this department
    const [[doctorCount]] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM doctors
      WHERE department_id = ?
    `, [departmentId]);

    // Check whether appointments are linked to this department
    const [[appointmentCount]] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM appointments
      WHERE department_id = ?
    `, [departmentId]);

    // Check whether queue tickets are linked to this department
    const [[queueCount]] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM queue_tickets
      WHERE department_id = ?
    `, [departmentId]);

    const totalReferences =
      Number(doctorCount.count) +
      Number(appointmentCount.count) +
      Number(queueCount.count);

    if (totalReferences > 0) {
      throw new ApiError(
        409,
        "This department cannot be deleted because it is already linked to doctors, appointments, or queue records. Deactivate it instead."
      );
    }

    await pool.query(
      `DELETE FROM departments WHERE id = ?`,
      [departmentId]
    );

    res.json({
      success: true,
      message: "Department deleted successfully"
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
