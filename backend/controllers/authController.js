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
// POST /api/auth/register
// ============================================================

async function register(req, res, next) {
  try {
    const {
      fullName,
      email,
      phone,
      password,
    } = req.body;

    if (!fullName || !email || !password) {
      throw new ApiError(
        400,
        "Full name, email and password are required"
      );
    }

    if (String(fullName).trim().length < 2) {
      throw new ApiError(
        400,
        "Full name must contain at least 2 characters"
      );
    }

    if (String(password).length < 8) {
      throw new ApiError(
        400,
        "Password must be at least 8 characters"
      );
    }

    const normalizedEmail =
      String(email).trim().toLowerCase();

    // Basic email validation
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      throw new ApiError(
        400,
        "Please provide a valid email address"
      );
    }

    // Check existing account
    const [existing] = await pool.query(
      `
      SELECT id
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [normalizedEmail]
    );

    if (existing.length > 0) {
      throw new ApiError(
        409,
        "An account with this email already exists"
      );
    }

    // Hash password
    const passwordHash =
      await bcrypt.hash(
        password,
        SALT_ROUNDS
      );

    // Public registration always creates patient
    const role = "patient";

    const [result] = await pool.query(
      `
      INSERT INTO users
        (
          full_name,
          email,
          phone,
          password_hash,
          role,
          is_active
        )
      VALUES
        (?, ?, ?, ?, ?, TRUE)
      `,
      [
        String(fullName).trim(),
        normalizedEmail,
        phone
          ? String(phone).trim()
          : null,
        passwordHash,
        role,
      ]
    );

    const user = {
      id: result.insertId,
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      phone: phone
        ? String(phone).trim()
        : null,
      role,
    };

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken =
      signAccessToken(payload);

    const refreshToken =
      signRefreshToken(payload);

    return res.status(201).json({
      success: true,
      message:
        "Account created successfully",

      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error(
      "Registration error:",
      err.message
    );

    next(err);
  }
}

// ============================================================
// LOGIN
// POST /api/auth/login
// ============================================================

async function login(req, res, next) {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      throw new ApiError(
        400,
        "Email and password are required"
      );
    }

    const normalizedEmail =
      String(email).trim().toLowerCase();

    const [rows] = await pool.query(
      `
      SELECT
        id,
        full_name,
        email,
        phone,
        password_hash,
        role,
        gender,
        date_of_birth,
        address,
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [normalizedEmail]
    );

    if (!rows.length) {
      throw new ApiError(
        401,
        "Invalid email or password"
      );
    }

    const user = rows[0];

    // Check active account
    if (!user.is_active) {
      throw new ApiError(
        403,
        "This account has been deactivated"
      );
    }

    // Verify password
    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password_hash
      );

    if (!passwordMatches) {
      throw new ApiError(
        401,
        "Invalid email or password"
      );
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

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
          phone: user.phone,
          role: user.role,
          gender: user.gender,
          dateOfBirth:
            user.date_of_birth,
          address: user.address,
          isActive:
            Boolean(user.is_active),
          createdAt:
            user.created_at,
          updatedAt:
            user.updated_at,
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
// REFRESH ACCESS TOKEN
// POST /api/auth/refresh
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

    // Make sure the account still exists
    const [rows] = await pool.query(
      `
      SELECT
        id,
        email,
        role,
        is_active
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [decoded.id]
    );

    if (!rows.length) {
      throw new ApiError(
        401,
        "User account no longer exists"
      );
    }

    if (!rows[0].is_active) {
      throw new ApiError(
        401,
        "User account has been deactivated"
      );
    }

    const accessToken =
      signAccessToken({
        id: rows[0].id,
        email: rows[0].email,
        role: rows[0].role,
      });

    return res.json({
      success: true,

      data: {
        accessToken,
      },
    });
  } catch (err) {
    if (
      err instanceof ApiError
    ) {
      return next(err);
    }

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
// GET /api/auth/me
// ============================================================

async function getMe(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    const [rows] = await pool.query(
      `
      SELECT
        id,
        full_name,
        email,
        phone,
        role,
        gender,
        date_of_birth,
        address,
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [req.user.id]
    );

    if (!rows.length) {
      throw new ApiError(
        404,
        "User not found"
      );
    }

    const user = rows[0];

    if (!user.is_active) {
      throw new ApiError(
        403,
        "This account has been deactivated"
      );
    }

    return res.json({
      success: true,

      data: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        gender: user.gender,
        dateOfBirth:
          user.date_of_birth,
        address: user.address,
        isActive:
          Boolean(user.is_active),
        createdAt:
          user.created_at,
        updatedAt:
          user.updated_at,
      },
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
