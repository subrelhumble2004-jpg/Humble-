// ============================================================
// CORS
// ============================================================

const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://humble-nd66.vercel.app",
]
  .filter(Boolean)
  .flatMap((url) => url.split(","))
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

console.log("🌍 Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header
      if (!origin) {
        return callback(null, true);
      }

      const cleanOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }

      console.error("❌ CORS blocked origin:", origin);

      return callback(new Error("CORS: Origin not allowed"));
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

    optionsSuccessStatus: 204,
  })
);
