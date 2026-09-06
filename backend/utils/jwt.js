const jwt = require("jsonwebtoken");

require("dotenv").config();

// ============================================================
// JWT CONFIGURATION
// ============================================================

const ACCESS_SECRET =
  process.env.JWT_SECRET;

const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET;

const ACCESS_EXPIRES_IN =
  process.env.JWT_EXPIRES_IN || "7d";

const REFRESH_EXPIRES_IN =
  process.env.JWT_REFRESH_EXPIRES_IN || "30d";

// ============================================================
// VALIDATE CONFIGURATION
// ============================================================

function ensureAccessSecret() {
  if (!ACCESS_SECRET) {
    throw new Error(
      "JWT_SECRET is not configured."
    );
  }
}

function ensureRefreshSecret() {
  if (!REFRESH_SECRET) {
    throw new Error(
      "JWT_REFRESH_SECRET is not configured."
    );
  }
}

// ============================================================
// SIGN ACCESS TOKEN
// ============================================================

function signAccessToken(payload) {
  ensureAccessSecret();

  return jwt.sign(
    payload,
    ACCESS_SECRET,
    {
      expiresIn: ACCESS_EXPIRES_IN,
    }
  );
}

// ============================================================
// SIGN REFRESH TOKEN
// ============================================================

function signRefreshToken(payload) {
  ensureRefreshSecret();

  return jwt.sign(
    payload,
    REFRESH_SECRET,
    {
      expiresIn: REFRESH_EXPIRES_IN,
    }
  );
}

// ============================================================
// VERIFY ACCESS TOKEN
// ============================================================

function verifyAccessToken(token) {
  ensureAccessSecret();

  if (!token) {
    throw new Error(
      "Access token is required."
    );
  }

  return jwt.verify(
    token,
    ACCESS_SECRET
  );
}

// ============================================================
// VERIFY REFRESH TOKEN
// ============================================================

function verifyRefreshToken(token) {
  ensureRefreshSecret();

  if (!token) {
    throw new Error(
      "Refresh token is required."
    );
  }

  return jwt.verify(
    token,
    REFRESH_SECRET
  );
}

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
