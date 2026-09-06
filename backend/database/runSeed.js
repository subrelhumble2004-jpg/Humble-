/**
 * MedQueue Pro Database Seeder
 *
 * Run with:
 * npm run seed
 *
 * This seed file matches database/schema.sql.
 */

require("dotenv").config();

const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");

const DEPARTMENTS = [
  {
    name: "General Medicine",
    description:
      "General medical consultation and primary healthcare services.",
    location: "Main Hospital",
  },
  {
    name: "Cardiology",
    description:
      "Diagnosis and treatment of heart and cardiovascular conditions.",
    location: "Specialist Wing",
  },
  {
    name: "Pediatrics",
    description:
      "Healthcare services for infants, children and adolescents.",
    location: "Children Wing",
  },
  {
    name: "Emergency",
    description:
      "Emergency medical assessment and treatment.",
    location: "Emergency Unit",
  },
  {
    name: "Dental",
    description:
      "Dental consultation, treatment and oral healthcare.",
    location: "Dental Clinic",
  },
  {
    name: "Obstetrics and Gynecology",
    description:
      "Women health, pregnancy and reproductive healthcare services.",
    location: "Women Health Unit",
  },
];

async function seed() {
  let connection;

  try {
    console.log("");
    console.log("========================================");
    console.log("       MEDQUEUE PRO DATABASE SEED");
    console.log("========================================");
    console.log("");

    connection = await pool.getConnection();

    await connection.beginTransaction();

    // ========================================================
    // DEPARTMENTS
    // ========================================================

    console.log("🌱 Seeding departments...");

    const departmentIds = {};

    for (const department of DEPARTMENTS) {
      const [result] = await connection.query(
        `
        INSERT INTO departments
          (name, description, location)
        VALUES
          (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          description = VALUES(description),
          location = VALUES(location)
        `,
        [
          department.name,
          department.description,
          department.location,
        ]
      );

      let departmentId = result.insertId;

      // If department already existed, retrieve its ID.
      if (!departmentId) {
        const [rows] = await connection.query(
          `
          SELECT id
          FROM departments
          WHERE name = ?
          LIMIT 1
          `,
          [department.name]
        );

        if (rows.length > 0) {
          departmentId = rows[0].id;
        }
      }

      departmentIds[department.name] = departmentId;

      console.log(
        `   ✅ ${department.name}`
      );
    }

    // ========================================================
    // ADMIN USER
    // ========================================================

    console.log("");
    console.log("🌱 Seeding admin user...");

    const adminPassword =
      process.env.SEED_ADMIN_PASSWORD;

    if (!adminPassword) {
      throw new Error(
        "SEED_ADMIN_PASSWORD is missing from the environment variables."
      );
    }

    const adminHash = await bcrypt.hash(
      adminPassword,
      Number(process.env.BCRYPT_SALT_ROUNDS) || 12
    );

    await connection.query(
      `
      INSERT INTO users
        (
          full_name,
          email,
          phone,
          password_hash,
          role,
          is_active
        )
      VALUES
        (
          ?,
          ?,
          ?,
          ?,
          'admin',
          TRUE
        )
      ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name),
        phone = VALUES(phone),
        role = 'admin',
        is_active = TRUE
      `,
      [
        "System Administrator",
        "admin@medqueuepro.com",
        "+2348030000000",
        adminHash,
      ]
    );

    console.log(
      "   ✅ Admin account ready"
    );

    // ========================================================
    // SAMPLE DOCTOR
    // ========================================================

    console.log("");
    console.log("🌱 Seeding sample doctor...");

    const doctorPassword =
      process.env.SEED_DOCTOR_PASSWORD;

    if (!doctorPassword) {
      throw new Error(
        "SEED_DOCTOR_PASSWORD is missing from the environment variables."
      );
    }

    const doctorHash = await bcrypt.hash(
      doctorPassword,
      Number(process.env.BCRYPT_SALT_ROUNDS) || 12
    );

    await connection.query(
      `
      INSERT INTO users
        (
          full_name,
          email,
          phone,
          password_hash,
          role,
          is_active
        )
      VALUES
        (
          ?,
          ?,
          ?,
          ?,
          'doctor',
          TRUE
        )
      ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name),
        phone = VALUES(phone),
        role = 'doctor',
        is_active = TRUE
      `,
      [
        "Dr. Amaka Obi",
        "amaka.obi@medqueuepro.com",
        "+2348030000001",
        doctorHash,
      ]
    );

    // ========================================================
    // GET DOCTOR USER ID
    // ========================================================

    const [doctorUsers] = await connection.query(
      `
      SELECT id
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      ["amaka.obi@medqueuepro.com"]
    );

    if (doctorUsers.length === 0) {
      throw new Error(
        "Sample doctor user could not be found."
      );
    }

    const doctorUserId =
      doctorUsers[0].id;

    // ========================================================
    // GET CARDIOLOGY DEPARTMENT
    // ========================================================

    const cardiologyId =
      departmentIds["Cardiology"];

    if (!cardiologyId) {
      throw new Error(
        "Cardiology department could not be found."
      );
    }

    // ========================================================
    // DOCTOR PROFILE
    // ========================================================

    await connection.query(
      `
      INSERT INTO doctors
        (
          user_id,
          department_id,
          specialization,
          license_number,
          consultation_fee,
          biography,
          availability_status
        )
      VALUES
        (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          'available'
        )
      ON DUPLICATE KEY UPDATE
        department_id = VALUES(department_id),
        specialization = VALUES(specialization),
        consultation_fee = VALUES(consultation_fee),
        biography = VALUES(biography),
        availability_status = 'available'
      `,
      [
        doctorUserId,
        cardiologyId,
        "Cardiologist",
        "MEDQUEUE-CARD-001",
        0.0,
        "Experienced cardiologist providing cardiovascular consultation and patient care.",
      ]
    );

    console.log(
      "   ✅ Dr. Amaka Obi profile ready"
    );

    // ========================================================
    // COMMIT
    // ========================================================

    await connection.commit();

    console.log("");
    console.log("========================================");
    console.log("          ✅ SEED COMPLETE");
    console.log("========================================");
    console.log("");
    console.log(
      "Departments: 6"
    );
    console.log(
      "Admin: admin@medqueuepro.com"
    );
    console.log(
      "Doctor: amaka.obi@medqueuepro.com"
    );
    console.log("");
    console.log(
      "Passwords are supplied through environment variables."
    );
    console.log("");
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Rollback failed:",
          rollbackError.message
        );
      }
    }

    console.error("");
    console.error("========================================");
    console.error("          ❌ SEED FAILED");
    console.error("========================================");
    console.error("");
    console.error(error.message);
    console.error("");
    console.error("No partial seed changes were committed.");
  } finally {
    if (connection) {
      connection.release();
    }

    await pool.end();

    process.exitCode = 0;
  }
}

seed();
