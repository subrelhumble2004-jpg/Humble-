require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const { pool, testConnection } = require("./config/db.js");
const { notFound, errorHandler } = require("./middleware/errorHandler.js");

const app = express();

const PORT = Number(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// ============================================================
// SECURITY
// ============================================================

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// ============================================================
// CORS
// ============================================================

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean)
  : [];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header
      // (mobile apps, Postman, server-to-server requests, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // During local development, allow requests if no
      // CLIENT_URL has been configured yet.
      if (NODE_ENV !== "production" && allowedOrigins.length === 0) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS: Origin not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ============================================================
// BODY PARSING
// ============================================================

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// ============================================================
// RATE LIMITING
// ============================================================

const apiLimiter = rateLimit({
  windowMs:
    Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,

  max: Number(process.env.RATE_LIMIT_MAX) || 200,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", apiLimiter);

// ============================================================
// ROOT ROUTE
// ============================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    application: "MedQueue Pro",
    message: "MedQueue Pro Backend is running successfully.",
    status: "online",
    environment: NODE_ENV,
    database: process.env.DB_NAME || "Not configured",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      success: true,
      application: "MedQueue Pro",
      server: "online",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "❌ Health check database error:",
      error.message
    );

    res.status(503).json({
      success: false,
      application: "MedQueue Pro",
      server: "online",
      database: "disconnected",
      message: "Database connection unavailable.",
    });
  }
});

// ============================================================
// ROUTE LOADER
// ============================================================

function loadRoute(files, endpoint, name) {
  for (const file of files) {
    const fullPath = path.join(__dirname, file);

    if (!fs.existsSync(fullPath)) {
      continue;
    }

    try {
      const route = require(fullPath);

      app.use(endpoint, route);

      console.log(`✅ ${name} routes loaded: ${endpoint}`);

      return;
    } catch (error) {
      console.error(
        `❌ ${name} routes failed to load:`,
        error.message
      );

      throw error;
    }
  }

  console.error(`❌ ${name} route file not found.`);

  throw new Error(`${name} route file is missing.`);
}

// ============================================================
// API ROUTES
// ============================================================

loadRoute(
  ["routes/authRoutes.js", "routes/auth.js"],
  "/api/auth",
  "Authentication"
);

loadRoute(
  ["routes/appointmentRoutes.js", "routes/appointments.js"],
  "/api/appointments",
  "Appointments"
);

loadRoute(
  ["routes/doctorRoutes.js", "routes/doctors.js"],
  "/api/doctors",
  "Doctors"
);

loadRoute(
  ["routes/departmentRoutes.js", "routes/departments.js"],
  "/api/departments",
  "Departments"
);

loadRoute(
  ["routes/queueRoutes.js", "routes/queue.js"],
  "/api/queue",
  "Queue"
);

// ============================================================
// ADMIN ROUTES
// IMPORTANT: This connects /api/admin to adminRoutes.js
// ============================================================

loadRoute(
  ["routes/adminRoutes.js", "routes/admin.js"],
  "/api/admin",
  "Admin"
);

// ============================================================
// 404 HANDLER
// ============================================================

app.use(notFound);

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(errorHandler);

// ============================================================
// START SERVER
// ============================================================

async function startServer() {
  try {
    console.log("");
    console.log("========================================");
    console.log("        MEDQUEUE PRO BACKEND");
    console.log("========================================");

    console.log(`Environment: ${NODE_ENV}`);
    console.log(`Port: ${PORT}`);

    console.log("📁 Database module: ./config/db.js");

    console.log("🔄 Connecting to MySQL...");

    await testConnection();

    console.log("✅ MySQL connection successful.");

    console.log("");
    console.log("========================================");
    console.log("🚀 MEDQUEUE PRO BACKEND READY");
    console.log("========================================");

    console.log(`🌐 Port: ${PORT}`);
    console.log(`🏥 Environment: ${NODE_ENV}`);
    console.log(
      `🗄️ Database: ${process.env.DB_NAME || "Not configured"}`
    );

    console.log("❤️ Health: /api/health");

    console.log("========================================");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("");

    console.error("========================================");
    console.error("❌ MEDQUEUE PRO FAILED TO START");
    console.error("========================================");

    console.error(error.message);

    console.error("========================================");

    process.exit(1);
  }
}

// ============================================================
// START ONLY WHEN THIS FILE IS RUN DIRECTLY
// ============================================================

if (require.main === module) {
  startServer();
}

// ============================================================
// EXPORT APP
// ============================================================

module.exports = app;
