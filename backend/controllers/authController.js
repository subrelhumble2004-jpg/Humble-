const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");

const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

const { ApiError } = require("../middleware/errorHandler");

const SALT_ROUNDS =
  Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

// ============================================================
// REGISTER
// @route POST /api/auth/register
// ============================================================

async function register(req, res, next) {
  try {
    const {
      fullName,
      email,
      phone,
      password,
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !password) {
      throw new ApiError(
        400,
        "Full name, email and password are required"
      );
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    // Check whether email already exists
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (existing.length > 0) {
      throw new ApiError(
        409,
        "An account with this email already exists"
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(
      password,
      SALT_ROUNDS
    );

    // Public registration can only create patients
    const safeRole = "patient";

    // Create user
    const [result] = await pool.query(
      `INSERT INTO users
       (full_name, email, phone, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`,
      [
        fullName.trim(),
        normalizedEmail,
        phone
          ? phone.trim()
          : null,
        passwordHash,
        safeRole,
      ]
    );

    // IMPORTANT:
    // The current MedQueue Pro database schema does not
    // contain a separate "patients" table.
    //
    // Patients are represented by users with role = "patient".
    // Therefore, we do NOT insert into patients here.

    const payload = {
      id: result.insertId,
      email: normalizedEmail,
      role: safeRole,
    };

    // Generate tokens
    const accessToken =
      signAccessToken(payload);

    const refreshToken =
      signRefreshToken(payload);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",

      data: {
        user: {
          id: result.insertId,
          fullName: fullName.trim(),
          email: normalizedEmail,
          role: safeRole,
        },

        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error(
      "Registration error:",
      err
    );

    next(err);
  }
}

// ============================================================
// LOGIN
// @route POST /api/auth/login
// ============================================================

async function login(req, res, next) {
  try {
    const {
      email,
      password,
    } = req.body;

    // Validate required fields
    if (!email || !password) {
      throw new ApiError(
        400,
        "Email and password are required"
      );
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    // Find user
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (!rows.length) {
      throw new ApiError(
        401,
        "Invalid email or password"
      );
    }

    const user = rows[0];

    // Check whether account is active
    if (
      Object.prototype.hasOwnProperty.call(
        user,
        "is_active"
      ) &&
      !user.is_active
    ) {
      throw new ApiError(
        403,
        "This account has been deactivated"
      );
    }

    // Compare password
    const match =
      await bcrypt.compare(
        password,
        user.password_hash
      );

    if (!match) {
      throw new ApiError(
        401,
        "Invalid email or password"
      );
    }

    // JWT payload
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    // Generate tokens
    const accessToken =
      signAccessToken(payload);

    const refreshToken =
      signRefreshToken(payload);

    return res.json({
      success: true,
      message: "Login successful",

      data: {
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
          avatarUrl:
            user.avatar_url || null,
        },

        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// REFRESH TOKEN
// @route POST /api/auth/refresh
// ============================================================

async function refresh(req, res, next) {
  try {
    const {
      refreshToken,
    } = req.body;

    if (!refreshToken) {
      throw new ApiError(
        400,
        "Refresh token is required"
      );
    }

    const decoded =
      verifyRefreshToken(
        refreshToken
      );

    const accessToken =
      signAccessToken({
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      });

    return res.json({
      success: true,

      data: {
        accessToken,
      },
    });
  } catch (err) {
    next(
      new ApiError(
        401,
        "Invalid or expired refresh token"
      )
    );
  }
}

// ============================================================
// GET CURRENT USER
// @route GET /api/auth/me
// ============================================================

async function getMe(req, res, next) {
  try {
    const [rows] =
      await pool.query(
        `SELECT
          id,
          full_name,
          email,
          phone,
          role,
          avatar_url,
          created_at
         FROM users
         WHERE id = ?`,
        [req.user.id]
      );

    if (!rows.length) {
      throw new ApiError(
        404,
        "User not found"
      );
    }

    return res.json({
      success: true,

      data: rows[0],
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  register,
  login,
  refresh,
  getMe,
};
