require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const xss = require("xss-clean");

const { testConnection } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const queueRoutes = require("./routes/queueRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

/* ---------- Security & core middleware ---------- */
app.use(helmet());                                    // sets secure HTTP headers
app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));              // body parsing (mitigates large-payload DoS)
app.use(express.urlencoded({ extended: true }));
app.use(xss());                                        // sanitizes user input against XSS
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use("/api", limiter);

// Note: mysql2 uses parameterized queries throughout (see controllers),
// which is the primary defense against SQL injection.

/* ---------- Routes ---------- */
app.get("/api/health", (req, res) => res.json({ success: true, message: "MedQueue Pro API is running", time: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

/* ---------- Start server ---------- */
const PORT = process.env.PORT || 5000;

(async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 MedQueue Pro API running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
  });
})();

module.exports = app;
