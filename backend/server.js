require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const { pool, testConnection } = require("./database/db");

const app = express();

// Railway provides PORT automatically.
// Local development falls back to 5000.
const PORT = process.env.PORT || 5000;

// --------------------------------------------------
// Security middleware
// --------------------------------------------------

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
      : "*",
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

// --------------------------------------------------
// Health check
// --------------------------------------------------

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

// --------------------------------------------------
// Routes
// --------------------------------------------------

try {
  const authRoutes = require("./routes/authRoutes");
  app.use("/api/auth", authRoutes);
} catch (error) {
  console.warn("Auth routes not loaded:", error.message);
}

try {
  const appointmentRoutes = require("./routes/appointmentRoutes");
  app.use("/api/appointments", appointmentRoutes);
} catch (error) {
  console.warn("Appointment routes not loaded:", error.message);
}

try {
  const doctorRoutes = require("./routes/doctorRoutes");
  app.use("/api/doctors", doctorRoutes);
} catch (error) {
  console.warn("Doctor routes not loaded:", error.message);
}

try {
  const departmentRoutes = require("./routes/departmentRoutes");
  app.use("/api/departments", departmentRoutes);
} catch (error) {
  console.warn("Department routes not loaded:", error.message);
}

try {
  const queueRoutes = require("./routes/queueRoutes");
  app.use("/api/queue", queueRoutes);
} catch (error) {
  console.warn("Queue routes not loaded:", error.message);
}

// --------------------------------------------------
// 404 handler
// --------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// --------------------------------------------------
// Error handler
// --------------------------------------------------

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// --------------------------------------------------
// Database migration (auto-creates tables if missing)
// --------------------------------------------------

async function runMigrations() {
  const schemaPath = path.join(__dirname, "schema.sql");

  if (!fs.existsSync(schemaPath)) {
    console.warn("⚠️  schema.sql not found — skipping migration");
    return;
  }

  const schema = fs.readFileSync(schemaPath, "utf8");

  const statements = schema
    .split(/;\s*[\r\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const stmt of statements) {
    if (stmt.trim()) {
      await pool.query(stmt);
    }
  }

  console.log("✅ Schema migration complete");
}

// --------------------------------------------------
// Start server
// --------------------------------------------------

async function startServer() {
  try {
    await testConnection();
    await runMigrations();

    app.listen(PORT, "0.0.0.0", () => {
      console.log("========================================");
      console.log("   MedQueue Pro Backend");
      console.log("========================================");
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`Port: ${PORT}`);
      console.log("Server: http://0.0.0.0:" + PORT);
      console.log("MySQL: Connected");
      console.log("========================================");
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
