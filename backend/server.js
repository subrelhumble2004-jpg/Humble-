require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { testConnection } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const queueRoutes = require("./routes/queueRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

/* ---------- Railway / reverse proxy ---------- */
app.set("trust proxy", 1);

/* ---------- Security & core middleware ---------- */
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  morgan(
    process.env.NODE_ENV === "production"
      ? "combined"
      : "dev"
  )
);

/* ---------- Rate limiting ---------- */
const limiter = rateLimit({
  windowMs:
    Number(process.env.RATE_LIMIT_WINDOW_MS) ||
    15 * 60 * 1000,

  max:
    Number(process.env.RATE_LIMIT_MAX) ||
    200,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

app.use("/api", limiter);

/* ---------- Health check ---------- */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "MedQueue Pro API is running",
    time: new Date().toISOString(),
  });
});

/* ---------- Routes ---------- */
app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/admin", adminRoutes);

/* ---------- Error handling ---------- */
app.use(notFound);
app.use(errorHandler);

/* ---------- Start server ---------- */
const PORT = process.env.PORT || 8080;

(async () => {
  try {
    await testConnection();

    app.listen(PORT, () => {
      console.log(
        `🚀 MedQueue Pro API running on port ${PORT}`
      );

      console.log(
        `Health check: /api/health`
      );
    });
  } catch (error) {
    console.error(
      "❌ Failed to start MedQueue Pro API:",
      error
    );

    process.exit(1);
  }
})();

module.exports = app;
