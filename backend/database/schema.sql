
// migrate.js
// Runs schema.sql against the connected MySQL database.
// Usage:
//   Locally:      node migrate.js
//   On Railway:   railway run node migrate.js
//
// Place this file in your backend project root, alongside schema.sql and db.js.

const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { pool } = require("./db");

async function migrate() {
  try {
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    // Split on semicolons that end a statement, ignore empty chunks/comments
    const statements = schema
      .split(/;\s*[\r\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`Running ${statements.length} statements...`);

    for (const stmt of statements) {
      if (stmt.trim()) {
        await pool.query(stmt);
      }
    }

    console.log("✅ Migration complete. Tables created (or already existed).");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
}

migrate();
