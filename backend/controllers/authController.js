const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { ApiError } = require("../middleware/errorHandler");

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

// @route POST /api/auth/register
async function register(req, res, next) {
  try {
    const { fullName, email, phone, password, role } = req.body;
    if (!fullName || !email || !password) throw new ApiError(400, "Full name, email and password are required");

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) throw new ApiError(409, "An account with this email already exists");

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const safeRole = role === "doctor" || role === "admin" ? "patient" : "patient"; // self-registration is always patient

    const [result] = await pool.query(
      "INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)",
      [fullName, email, phone || null, passwordHash, safeRole]
    );
    await pool.query("INSERT INTO patients (user_id) VALUES (?)", [result.insertId]);

    const payload = { id: result.insertId, email, role: safeRole };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: { user: { id: result.insertId, fullName, email, role: safeRole }, accessToken, refreshToken },
    });
  } catch (err) {
    next(err);
  }
}

// @route POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new ApiError(400, "Email and password are required");

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (!rows.length) throw new ApiError(401, "Invalid email or password");

    const user = rows[0];
    if (!user.is_active) throw new ApiError(403, "This account has been deactivated");

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) throw new ApiError(401, "Invalid email or password");

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role, avatarUrl: user.avatar_url },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

// @route POST /api/auth/refresh
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new ApiError(400, "Refresh token is required");
    const decoded = verifyRefreshToken(refreshToken);
    const accessToken = signAccessToken({ id: decoded.id, email: decoded.email, role: decoded.role });
    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    next(new ApiError(401, "Invalid or expired refresh token"));
  }
}

// @route GET /api/auth/me
async function getMe(req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT id, full_name, email, phone, role, avatar_url, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!rows.length) throw new ApiError(404, "User not found");
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, getMe };
