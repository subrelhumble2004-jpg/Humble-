require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const { pool, testConnection } = require("./database/db");

const app = express();

// ==================================================
// PORT
// ==================================================

const PORT = process.env.PORT || 5000;

// ==================================================
// SECURITY
// ==================================================

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
      : true,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", limiter);

// ==================================================
// BASIC ROUTES
// ==================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MedQueue Pro Backend is running",
    environment: process.env.NODE_ENV || "development",
    database: process.env.DB_NAME || "medqueue_pro",
  });
});

app.get("/api/health", async (req, res) => {
  res.status(200).json({
    success: true,
    message: "MedQueue Pro API is healthy",
    timestamp: new Date().toISOString(),
  });
});

// ==================================================
// ROUTES
// ==================================================

function loadRoute(routePath, apiPath, routeName) {
  try {
    const route = require(routePath);
    app.use(apiPath, route);
    console.log(`✅ ${routeName} route loaded`);
  } catch (error) {
    console.warn(`⚠️ ${routeName} route not loaded: ${error.message}`);
  }
}

loadRoute(
  "./routes/authRoutes",
  "/api/auth",
  "Authentication"
);

loadRoute(
  "./routes/appointmentRoutes",
  "/api/appointments",
  "Appointments"
);

loadRoute(
  "./routes/doctorRoutes",
  "/api/doctors",
  "Doctors"
);

loadRoute(
  "./routes/departmentRoutes",
  "/api/departments",
  "Departments"
);

loadRoute(
  "./routes/queueRoutes",
  "/api/queue",
  "Queue"
);

// ==================================================
// DATABASE SCHEMA MIGRATION
// ==================================================

async function runMigrations() {
  const schemaPath = path.join(__dirname, "schema.sql");

  if (!fs.existsSync(schemaPath)) {
    console.warn(
      "⚠️ schema.sql was not found in the backend folder."
    );
    console.warn(
      "⚠️ Database migration was skipped."
    );
    return;
  }

  console.log("📄 Loading schema.sql...");

  const schema = fs.readFileSync(schemaPath, "utf8");

  // Remove SQL comments
  const cleanedSchema = schema
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  // Split SQL statements
  const statements = cleanedSchema
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  console.log(
    `📊 Found ${statements.length} SQL statements.`
  );

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (error) {
      console.error(
        "❌ Migration statement failed:",
        error.message
      );

      console.error(
        "SQL:",
        statement.substring(0, 200)
      );

      throw error;
    }
  }

  console.log("✅ Database schema migration completed.");
}

// ==================================================
// 404 HANDLER
// ==================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// ==================================================
// ERROR HANDLER
// ==================================================

app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ==================================================
// START SERVER
// ==================================================

async function startServer() {
  try {
    console.log("========================================");
    console.log("       MedQueue Pro Backend");
    console.log("========================================");

    console.log("🔄 Testing MySQL connection...");

    await testConnection();

    console.log("✅ MySQL connection successful.");

    console.log("🔄 Checking database schema...");

    await runMigrations();

    app.listen(PORT, "0.0.0.0", () => {
      console.log("----------------------------------------");
      console.log("🚀 MedQueue Pro Backend is running");
      console.log(`🌐 Port: ${PORT}`);
      console.log(`🏥 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log("----------------------------------------");
      console.log("✅ Server started successfully");
      console.log("========================================");
    });
  } catch (error) {
    console.error("========================================");
    console.error("❌ FAILED TO START SERVER");
    console.error("========================================");
    console.error(error.message);
    console.error("========================================");

    process.exit(1);
  }
}

startServer();

module.exports = app;
