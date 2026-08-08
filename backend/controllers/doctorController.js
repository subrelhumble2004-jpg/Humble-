const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const { ApiError } = require("../middleware/errorHandler");

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

const DOCTOR_SELECT = `
  SELECT d.id, u.full_name AS name, u.email, u.phone, u.avatar_url AS avatarUrl,
         dept.name AS department, dept.id AS departmentId,
         d.specialization, d.bio, d.education, d.years_experience AS yearsExperience,
         d.consultation_fee AS consultationFee, d.rating, d.status, d.working_hours AS workingHours
  FROM doctors d
  JOIN users u ON u.id = d.user_id
  JOIN departments dept ON dept.id = d.department_id
`;

async function getAllDoctors(req, res, next) {
  try {
    const { department, status } = req.query;
    let query = DOCTOR_SELECT + " WHERE 1=1";
    const params = [];
    if (department) { query += " AND dept.name = ?"; params.push(department); }
    if (status) { query += " AND d.status = ?"; params.push(status); }
    query += " ORDER BY d.rating DESC";
    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    next(err);
  }
}

async function getDoctor(req, res, next) {
  try {
    const [rows] = await pool.query(DOCTOR_SELECT + " WHERE d.id = ?", [req.params.id]);
    if (!rows.length) throw new ApiError(404, "Doctor not found");
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// Admin: create a doctor (creates linked user account + doctor profile)
async function createDoctor(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { fullName, email, phone, password, departmentId, specialization, bio, education, yearsExperience, consultationFee, workingHours } = req.body;
    if (!fullName || !email || !password || !departmentId) {
      throw new ApiError(400, "fullName, email, password and departmentId are required");
    }

    await conn.beginTransaction();
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [userResult] = await conn.query(
      "INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'doctor')",
      [fullName, email, phone || null, passwordHash]
    );
    const [doctorResult] = await conn.query(
      `INSERT INTO doctors (user_id, department_id, specialization, bio, education, years_experience, consultation_fee, working_hours)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userResult.insertId, departmentId, specialization || null, bio || null, education || null, yearsExperience || 0, consultationFee || 0, workingHours || null]
    );
    await conn.commit();

    res.status(201).json({ success: true, message: "Doctor created", data: { id: doctorResult.insertId } });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

async function updateDoctorStatus(req, res, next) {
  try {
    const { status } = req.body; // available | in_session | off_duty
    if (!["available", "in_session", "off_duty"].includes(status)) throw new ApiError(400, "Invalid status");
    await pool.query("UPDATE doctors SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ success: true, message: "Doctor status updated" });
  } catch (err) {
    next(err);
  }
}

async function updateDoctor(req, res, next) {
  try {
    const { specialization, bio, education, yearsExperience, consultationFee, workingHours } = req.body;
    await pool.query(
      `UPDATE doctors SET
        specialization = COALESCE(?, specialization),
        bio = COALESCE(?, bio),
        education = COALESCE(?, education),
        years_experience = COALESCE(?, years_experience),
        consultation_fee = COALESCE(?, consultation_fee),
        working_hours = COALESCE(?, working_hours)
       WHERE id = ?`,
      [specialization, bio, education, yearsExperience, consultationFee, workingHours, req.params.id]
    );
    res.json({ success: true, message: "Doctor profile updated" });
  } catch (err) {
    next(err);
  }
}

async function deleteDoctor(req, res, next) {
  try {
    const [[doc]] = await pool.query("SELECT user_id FROM doctors WHERE id = ?", [req.params.id]);
    if (!doc) throw new ApiError(404, "Doctor not found");
    await pool.query("DELETE FROM users WHERE id = ?", [doc.user_id]); // cascades to doctors table
    res.json({ success: true, message: "Doctor removed" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllDoctors, getDoctor, createDoctor, updateDoctor, updateDoctorStatus, deleteDoctor };
