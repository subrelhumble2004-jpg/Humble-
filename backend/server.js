require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const { pool, testConnection } = require("./database/db.js");

const app = express();

// ============================================================
// SERVER CONFIGURATION
// ============================================================

const PORT = Number(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// ============================================================
// SECURITY
// ============================================================

app.use(
  helmet({
    crossOriginResourcePolicy: false
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
      if (!origin) {
        return callback(null, true);
      }

      // Allow all origins during development
      if (
        NODE_ENV !== "production" &&
        allowedOrigins.length === 0
      ) {
        return callback(null, true);
      }

      // Allow configured frontend origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("CORS: Origin not allowed")
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization"
    ]
  })
);

// ============================================================
// BODY PARSER
// ============================================================

app.use(
  express.json({
    limit: "10mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb"
  })
);

// ============================================================
// RATE LIMITING
// ============================================================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests. Please try again later."
  }
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
    environment: NODE_ENV,
    status: "online",
    database: process.env.DB_NAME || "Railway MySQL",
    timestamp: new Date().toISOString()
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
      timestamp: new Date().toISOString()
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
      message: "Database connection unavailable."
    });
  }
});

// ============================================================
// ROUTE LOADER
// ============================================================

function loadRoute(file, endpoint, name) {
  try {
    const route = require(file);

    app.use(endpoint, route);

    console.log(
      `✅ ${name} routes loaded at ${endpoint}`
    );
  } catch (error) {
    console.warn(
      `⚠️ ${name} routes were not loaded: ${error.message}`
    );
  }
}

// ============================================================
// APPLICATION ROUTES
// ============================================================

loadRoute(
  "./routes/authRoutes.js",
  "/api/auth",
  "Authentication"
);

loadRoute(
  "./routes/appointmentRoutes.js",
  "/api/appointments",
  "Appointments"
);

loadRoute(
  "./routes/doctorRoutes.js",
  "/api/doctors",
  "Doctors"
);

loadRoute(
  "./routes/departmentRoutes.js",
  "/api/departments",
  "Departments"
);

loadRoute(
  "./routes/queueRoutes.js",
  "/api/queue",
  "Queue"
);

// ============================================================
// DATABASE SCHEMA MIGRATION
// ============================================================

async function runDatabaseSchema() {
  const schemaPath = path.join(
    __dirname,
    "schema.sql"
  );

  if (!fs.existsSync(schemaPath)) {
    console.warn(
      "⚠️ schema.sql was not found."
    );

    console.warn(
      `Expected location: ${schemaPath}`
    );

    console.warn(
      "⚠️ Database migration skipped."
    );

    return;
  }

  console.log(
    "📄 schema.sql found."
  );

  const schema = fs.readFileSync(
    schemaPath,
    "utf8"
  );

  // Remove SQL comments
  const cleanedSchema = schema
    .split(/\r?\n/)
    .filter(
      (line) =>
        !line.trim().startsWith("--")
    )
    .join("\n");

  // Split SQL commands
  const statements = cleanedSchema
    .split(";")
    .map(
      (statement) =>
        statement.trim()
    )
    .filter(Boolean);

  console.log(
    `📊 Found ${statements.length} SQL statements.`
  );

  for (
    let i = 0;
    i < statements.length;
    i++
  ) {
    try {
      await pool.query(
        statements[i]
      );

      console.log(
        `✅ SQL statement ${
          i + 1
        }/${statements.length} completed`
      );
    } catch (error) {
      console.error(
        `❌ SQL statement ${
          i + 1
        } failed:`,
        error.message
      );

      console.error(
        "SQL:",
        statements[i].substring(
          0,
          300
        )
      );

      throw error;
    }
  }

  console.log(
    "========================================"
  );

  console.log(
    "✅ DATABASE SCHEMA READY"
  );

  console.log(
    "========================================"
  );
}

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(
  (error, req, res, next) => {
    console.error(
      "❌ Server error:",
      error.message
    );

    res.status(
      error.status || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Internal server error."
    });
  }
);

// ============================================================
// START SERVER
// ============================================================

async function startServer() {
  try {
    console.log("");
    console.log(
      "========================================"
    );

    console.log(
      "        MEDQUEUE PRO BACKEND"
    );

    console.log(
      "========================================"
    );

    console.log(
      `Environment: ${NODE_ENV}`
    );

    console.log(
      `Port: ${PORT}`
    );

    console.log(
      "🔄 Connecting to MySQL..."
    );

    // Test database connection
    await testConnection();

    console.log(
      "✅ MySQL connection successful."
    );

    // Run database schema
    console.log(
      "🔄 Checking database schema..."
    );

    await runDatabaseSchema();

    // Start Express server
    app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log("");
        console.log(
          "========================================"
        );

        console.log(
          "🚀 MEDQUEUE PRO IS ONLINE"
        );

        console.log(
          "========================================"
        );

        console.log(
          `🌐 Port: ${PORT}`
        );

        console.log(
          `🏥 Environment: ${NODE_ENV}`
        );

        console.log(
          `🗄️ Database: ${
            process.env.DB_NAME ||
            "Railway MySQL"
          }`
        );

        console.log(
          "❤️ Health endpoint: /api/health"
        );

        console.log(
          "========================================"
        );

        console.log(
          "Server started successfully."
        );

        console.log(
          "========================================"
        );
      }
    );
  } catch (error) {
    console.error("");
    console.error(
      "========================================"
    );

    console.error(
      "❌ MEDQUEUE PRO FAILED TO START"
    );

    console.error(
      "========================================"
    );

    console.error(
      error.message
    );

    console.error(
      "========================================"
    );

    process.exit(1);
  }
}

// ============================================================
// START APPLICATION
// ============================================================

startServer();

// ============================================================
// EXPORT
// ============================================================

module.exports = app;
