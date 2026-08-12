const fs = require("fs");
const path = require("path");
const { pool, testConnection } = require("./db");

async function runMigrations() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const statements = schema
    .split(/;\s*[\r\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const stmt of statements) {
    if (stmt.trim()) await pool.query(stmt);
  }
  console.log("✅ Schema migration complete");
}

async function startServer() {
  await testConnection();
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`🚀 MedQueue Pro API running on port ${PORT}`);
  });
}

startServer();
