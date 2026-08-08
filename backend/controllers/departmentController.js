const { pool } = require("../config/db");
const { ApiError } = require("../middleware/errorHandler");

async function getAllDepartments(req, res, next) {
  try {
    const [rows] = await pool.query("SELECT * FROM departments ORDER BY name ASC");
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function getDepartment(req, res, next) {
  try {
    const [rows] = await pool.query("SELECT * FROM departments WHERE id = ?", [req.params.id]);
    if (!rows.length) throw new ApiError(404, "Department not found");
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function createDepartment(req, res, next) {
  try {
    const { name, code, description, icon, imageUrl } = req.body;
    if (!name || !code) throw new ApiError(400, "Name and code are required");
    const [result] = await pool.query(
      "INSERT INTO departments (name, code, description, icon, image_url) VALUES (?, ?, ?, ?, ?)",
      [name, code.toUpperCase(), description || null, icon || null, imageUrl || null]
    );
    res.status(201).json({ success: true, message: "Department created", data: { id: result.insertId } });
  } catch (err) {
    next(err);
  }
}

async function updateDepartment(req, res, next) {
  try {
    const { name, description, icon, imageUrl } = req.body;
    await pool.query(
      "UPDATE departments SET name = COALESCE(?, name), description = COALESCE(?, description), icon = COALESCE(?, icon), image_url = COALESCE(?, image_url) WHERE id = ?",
      [name, description, icon, imageUrl, req.params.id]
    );
    res.json({ success: true, message: "Department updated" });
  } catch (err) {
    next(err);
  }
}

async function deleteDepartment(req, res, next) {
  try {
    await pool.query("DELETE FROM departments WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Department deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment };
