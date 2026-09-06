/**
 * MedQueue Pro Database Seeder
 *
 * Run with:
 * npm run seed
 *
 * This seed file matches database/schema.sql.
 *
 * IMPORTANT:
 * - This file does NOT delete existing data.
 * - It is safe to run more than once.
 * - Real passwords must come from environment variables.
 */

require("dotenv").config();

const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");

const DEPARTMENTS = [
  {
    name: "General Medicine",
    description:
      "General medical consultation and primary healthcare services.",
    location: "Main Hospital"
  },
  {
    name: "Cardiology",
    description:
      "Diagnosis and treatment of heart and cardiovascular conditions.",
    location: "Specialist Wing"
  },
  {
    name: "Pediatrics",
    description:
      "Healthcare services for infants, children and adolescents.",
    location: "Children Wing"
  },
  {
    name: "Emergency",
    description:
      "Emergency medical assessment and treatment.",
    location: "Emergency Unit"
  },
  {
    name: "Dental",
    description:
      "Dental consultation, treatment and oral healthcare.",
    location: "Dental Clinic"
  },
  {
    name: "Obstetrics and Gynecology",
    description:
      "Women health, pregnancy and reproductive healthcare services.",
    location: "Women Health Unit"
  }
];

const BCRYPT_ROUNDS =
  Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

async function getDepartmentId(connection, name) {
  const [rows] = await connection.query(
    `
    SELECT id
    FROM departments
    WHERE name = ?
    LIMIT 1
    `,
    [name]
  );

  return rows.length ? rows[0].id : null;
}

async function seedDepartments(connection) {
  console.log("🌱 Seeding departments...");

  const departmentIds = {};

  for (const department of DEPARTMENTS) {
    const existingId = await getDepartmentId(
      connection,
      department.name
    );

    if (existingId) {
      await connection.query(
        `
        UPDATE departments
        SET
          description = ?,
          location = ?,
          is_active = TRUE
        WHERE id = ?
        `,
        [
          department.description,
          department.location,
          existingId
        ]
      );

      departmentIds[department.name] = existingId;
    } else {
      const [result] = await connection.query(
        `
        INSERT INTO departments
          (
            name,
            description,
            location,
            is_active
          )
        VALUES
          (?, ?, ?, TRUE)
        `,
        [
          department.name,
          department.description,
          department.location
        ]
      );

      departmentIds[department.name] = result.insertId;
    }

    console.log(`   ✅ ${department.name}`);
  }

  return departmentIds;
}

async function seedAdmin(connection) {
  console.log("");
  console.log("🌱 Seeding admin user...");

  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is missing from the environment variables."
    );
  }

  if (adminPassword.length < 8) {
    throw new Error(
      "SEED_ADMIN_PASSWORD must contain at least 8 characters."
    );
  }

  const adminHash = await bcrypt.hash(
    adminPassword,
    BCRYPT_ROUNDS
  );

  const [existing] = await connection.query(
    `
    SELECT id
    FROM users
    WHERE email = ?
    LIMIT 1
    `,
    ["admin@medqueuepro.com"]
  );

  if (existing.length) {
    await connection.query(
      `
      UPDATE users
      SET
        full_name = ?,
        phone = ?,
        role = 'admin',
        is_active = TRUE
      WHERE id = ?
      `,
      [
        "System Administrator",
        "+2348030000000",
        existing[0].id
      ]
    );
  } else {
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
        (?, ?, ?, ?, 'admin', TRUE)
      `,
      [
        "System Administrator",
        "admin@medqueuepro.com",
        "+2348030000000",
        adminHash
      ]
    );
  }

  console.log("   ✅ Admin account ready");
}

async function seedDoctor(connection, departmentIds) {
  console.log("");
  console.log("🌱 Seeding sample doctor...");

  const doctorPassword =
    process.env.SEED_DOCTOR_PASSWORD;

  if (!doctorPassword) {
    throw new Error(
      "SEED_DOCTOR_PASSWORD is missing from the environment variables."
    );
  }

  if (doctorPassword.length < 8) {
    throw new Error(
      "SEED_DOCTOR_PASSWORD must contain at least 8 characters."
    );
  }

  const cardiologyId =
    departmentIds["Cardiology"];

  if (!cardiologyId) {
    throw new Error(
      "Cardiology department could not be found."
    );
  }

  const doctorEmail =
    "amaka.obi@medqueuepro.com";

  const doctorHash = await bcrypt.hash(
    doctorPassword,
    BCRYPT_ROUNDS
  );

  // --------------------------------------------------------
  // DOCTOR USER
  // --------------------------------------------------------

  const [existingUsers] = await connection.query(
    `
    SELECT id, role
    FROM users
    WHERE email = ?
    LIMIT 1
    `,
    [doctorEmail]
  );

  let doctorUserId;

  if (existingUsers.length) {
    doctorUserId = existingUsers[0].id;

    await connection.query(
      `
      UPDATE users
      SET
        full_name = ?,
        phone = ?,
        password_hash = ?,
        role = 'doctor',
        is_active = TRUE
      WHERE id = ?
      `,
      [
        "Dr. Amaka Obi",
        "+2348030000001",
        doctorHash,
        doctorUserId
      ]
    );
  } else {
    const [result] = await connection.query(
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
        (?, ?, ?, ?, 'doctor', TRUE)
      `,
      [
        "Dr. Amaka Obi",
        doctorEmail,
        "+2348030000001",
        doctorHash
      ]
    );

    doctorUserId = result.insertId;
  }

  // --------------------------------------------------------
  // DOCTOR PROFILE
  // --------------------------------------------------------

  const [existingDoctors] = await connection.query(
    `
    SELECT id
    FROM doctors
    WHERE user_id = ?
    LIMIT 1
    `,
    [doctorUserId]
  );

  if (existingDoctors.length) {
    await connection.query(
      `
      UPDATE doctors
      SET
        department_id = ?,
        specialization = ?,
        license_number = ?,
        consultation_fee = ?,
        biography = ?,
        availability_status = 'available'
      WHERE user_id = ?
      `,
      [
        cardiologyId,
        "Cardiologist",
        "MEDQUEUE-CARD-001",
        0.0,
        "Experienced cardiologist providing cardiovascular consultation and patient care.",
        doctorUserId
      ]
    );
  } else {
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
        (?, ?, ?, ?, ?, ?, 'available')
      `,
      [
        doctorUserId,
        cardiologyId,
        "Cardiologist",
        "MEDQUEUE-CARD-001",
        0.0,
        "Experienced cardiologist providing cardiovascular consultation and patient care."
      ]
    );
  }

  console.log(
    "   ✅ Dr. Amaka Obi profile ready"
  );
}

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

    // --------------------------------------------------------
    // DEPARTMENTS
    // --------------------------------------------------------

    const departmentIds =
      await seedDepartments(connection);

    // --------------------------------------------------------
    // ADMIN
    // --------------------------------------------------------

    await seedAdmin(connection);

    // --------------------------------------------------------
    // SAMPLE DOCTOR
    // --------------------------------------------------------

    await seedDoctor(
      connection,
      departmentIds
    );

    // --------------------------------------------------------
    // COMMIT
    // --------------------------------------------------------

    await connection.commit();

    console.log("");
    console.log("========================================");
    console.log("          ✅ SEED COMPLETE");
    console.log("========================================");
    console.log("");
    console.log("Departments: 6");
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
          "❌ Rollback failed:",
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
    console.error(
      "No seed changes were committed."
    );

    // IMPORTANT:
    // A failed seed must return a failure exit code.
    process.exitCode = 1;
  } finally {
    if (connection) {
      connection.release();
    }

    await pool.end();
  }
}

seed();
