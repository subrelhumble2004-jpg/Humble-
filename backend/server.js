require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { testConnection } = require("./config/db");
const {
  notFound,
  errorHandler,
} = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const queueRoutes = require("./routes/queueRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

/* =========================================================
   RAILWAY / REVERSE PROXY
   ========================================================= */

app.set("trust proxy", 1);

/* =========================================================
   SECURITY
   ========================================================= */

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

/* =========================================================
   CORS
   ========================================================= */

const allowedOrigins = [
  "https://humble-three.vercel.app",
  "https://humble-git-main-humble3.vercel.app",
  "http://localhost:3000",
];

const configuredClientUrl = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.replace(/\/+$/, "")
  : null;

if (configuredClientUrl) {
  allowedOrigins.push(configuredClientUrl);
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header
      // (health checks, server-to-server requests, etc.)
      if (!origin) {
        return callback(null, true);
      }

      const cleanOrigin = origin.replace(/\/+$/, "");

      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }

      console.log("CORS blocked origin:", origin);

      return callback(
        new Error("Not allowed by CORS")
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

/* =========================================================
   BODY PARSING
   ========================================================= */

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

/* =========================================================
   LOGGING
   ========================================================= */

app.use(
  morgan(
    process.env.NODE_ENV === "production"
      ? "combined"
      : "dev"
  )
);

/* =========================================================
   RATE LIMITING
   ========================================================= */

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
    message:
      "Too many requests, please try again later.",
  },
});

app.use("/api", limiter);

/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MedQueue Pro API is running",
    time: new Date().toISOString(),
  });
});

/* =========================================================
   API ROUTES
   ========================================================= */

app.use("/api/auth", authRoutes);

app.use(
  "/api/departments",
  departmentRoutes
);

app.use(
  "/api/doctors",
  doctorRoutes
);

app.use(
  "/api/appointments",
  appointmentRoutes
);

app.use(
  "/api/queue",
  queueRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

/* =========================================================
   ERROR HANDLING
   ========================================================= */

app.use(notFound);
app.use(errorHandler);

/* =========================================================
   START SERVER
   ========================================================= */

const PORT = process.env.PORT || 8080;

(async () => {
  try {
    await testConnection();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `🚀 MedQueue Pro API running on port ${PORT}`
      );

      console.log(
        "Health check: /api/health"
      );

      console.log(
        "Allowed frontend origins:",
        allowedOrigins
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
