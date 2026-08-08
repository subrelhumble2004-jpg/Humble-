/**
 * Seeds the database with departments, an admin user, and sample doctors.
 * Run with: npm run seed
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");

const DEPARTMENTS = [
  ["Emergency", "EMR", "24/7 critical & trauma care"],
  ["Cardiology", "CARD", "Heart health & diagnostics"],
  ["Neurology", "NEURO", "Brain & nervous system"],
  ["Orthopedics", "ORTHO", "Bones, joints & mobility"],
  ["Dentistry", "DENT", "Oral & dental care"],
  ["Pediatrics", "PEDS", "Child & infant health"],
  ["Radiology", "RAD", "Imaging & scans"],
  ["Laboratory", "LAB", "Diagnostics & pathology"],
  ["General Medicine", "GEN", "Primary & family care"],
  ["Surgery", "SURG", "Operative procedures"],
  ["Dermatology", "DERM", "Skin, hair & nails"],
  ["Gynecology", "GYNO", "Women's health"],
];

async function seed() {
  const conn = await pool.getConnection();
  try {
    console.log("🌱 Seeding departments...");
    for (const [name, code, description] of DEPARTMENTS) {
      await conn.query(
        `INSERT INTO departments (name, code, description) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE description = VALUES(description)`,
        [name, code, description]
      );
    }

    console.log("🌱 Seeding admin user...");
    const adminHash = await bcrypt.hash("Admin@12345", Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
    await conn.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ('System Admin', 'admin@medqueuepro.com', '+2348030000000', ?, 'admin')
       ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)`,
      [adminHash]
    );

    console.log("🌱 Seeding sample doctor...");
    const docHash = await bcrypt.hash("Doctor@12345", Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
    const [userResult] = await conn.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ('Dr. Amaka Obi', 'amaka.obi@medqueuepro.com', '+2348030000001', ?, 'doctor')
       ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)`,
      [docHash]
    );
    const [[cardiology]] = await conn.query(`SELECT id FROM departments WHERE code = 'CARD'`);
    const [[existingUser]] = await conn.query(`SELECT id FROM users WHERE email = 'amaka.obi@medqueuepro.com'`);
    await conn.query(
      `INSERT INTO doctors (user_id, department_id, specialization, years_experience, rating, status)
       VALUES (?, ?, 'Cardiologist', 12, 4.9, 'available')
       ON DUPLICATE KEY UPDATE specialization = VALUES(specialization)`,
      [existingUser.id, cardiology.id]
    );

    console.log("✅ Seed complete.");
    console.log("   Admin login:  admin@medqueuepro.com / Admin@12345");
    console.log("   Doctor login: amaka.obi@medqueuepro.com / Doctor@12345");
  } catch (err) {
    console.error("❌ Seed failed:", err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();
