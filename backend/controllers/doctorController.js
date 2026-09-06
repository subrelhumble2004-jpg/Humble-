const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const { ApiError } = require("../middleware/errorHandler");

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

const DOCTOR_SELECT = `
  SELECT
    d.id,
    u.id AS userId,
    u.full_name AS name,
    u.email,
    u.phone,

    dept.id AS departmentId,
    dept.name AS department,
    dept.location AS departmentLocation,

    d.specialization,
    d.license_number AS licenseNumber,
    d.consultation_fee AS consultationFee,
    d.biography AS biography,
    d.availability_status AS availabilityStatus,

    d.created_at AS createdAt,
    d.updated_at AS updatedAt

  FROM doctors d
  INNER JOIN users u
    ON u.id = d.user_id
  INNER JOIN departments dept
    ON dept.id = d.department_id
`;


/**
 * GET /api/doctors
 * Public doctor directory.
 */
async function getAllDoctors(req, res, next) {
  try {
    const { department, status } = req.query;

    let query = DOCTOR_SELECT + `
      WHERE u.is_active = TRUE
        AND dept.is_active = TRUE
    `;

    const params = [];

    if (department) {
      query += ` AND dept.id = ?`;
      params.push(department);
    }

    if (status) {
      const allowedStatuses = [
        "available",
        "unavailable",
        "on_leave",
      ];

      if (!allowedStatuses.includes(status)) {
        throw new ApiError(
          400,
          "Invalid doctor status"
        );
      }

      query += ` AND d.availability_status = ?`;
      params.push(status);
    }

    query += `
      ORDER BY
        d.availability_status = 'available' DESC,
        u.full_name ASC
    `;

    const [rows] = await pool.query(query, params);

    res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    next(err);
  }
}


/**
 * GET /api/doctors/:id
 * Get one doctor.
 */
async function getDoctor(req, res, next) {
  try {
    const [rows] = await pool.query(
      DOCTOR_SELECT + `
        WHERE d.id = ?
          AND u.is_active = TRUE
      `,
      [req.params.id]
    );

    if (!rows.length) {
      throw new ApiError(
        404,
        "Doctor not found"
      );
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (err) {
    next(err);
  }
}


/**
 * POST /api/doctors
 * Admin creates a doctor account and doctor profile.
 */
async function createDoctor(req, res, next) {
  const conn = await pool.getConnection();

  try {
    const {
      fullName,
      email,
      phone,
      password,
      departmentId,
      specialization,
      licenseNumber,
      consultationFee,
      biography,
    } = req.body;

    if (
      !fullName ||
      !email ||
      !password ||
      !departmentId ||
      !specialization
    ) {
      throw new ApiError(
        400,
        "fullName, email, password, departmentId and specialization are required"
      );
    }

    if (password.length < 8) {
      throw new ApiError(
        400,
        "Doctor password must be at least 8 characters"
      );
    }

    await conn.beginTransaction();

    // Check department.
    const [[department]] = await conn.query(
      `
      SELECT id
      FROM departments
      WHERE id = ?
        AND is_active = TRUE
      LIMIT 1
      `,
      [departmentId]
    );

    if (!department) {
      throw new ApiError(
        404,
        "Department not found or inactive"
      );
    }

    // Check duplicate email before inserting.
    const [[existingUser]] = await conn.query(
      `
      SELECT id
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [email]
    );

    if (existingUser) {
      throw new ApiError(
        409,
        "A user with this email already exists"
      );
    }

    // Check license number if supplied.
    if (licenseNumber) {
      const [[existingLicense]] = await conn.query(
        `
        SELECT id
        FROM doctors
        WHERE license_number = ?
        LIMIT 1
        `,
        [licenseNumber]
      );

      if (existingLicense) {
        throw new ApiError(
          409,
          "A doctor with this license number already exists"
        );
      }
    }

    const passwordHash = await bcrypt.hash(
      password,
      SALT_ROUNDS
    );

    const [userResult] = await conn.query(
      `
      INSERT INTO users (
        full_name,
        email,
        phone,
        password_hash,
        role,
        is_active
      )
      VALUES (?, ?, ?, ?, 'doctor', TRUE)
      `,
      [
        fullName,
        email,
        phone || null,
        passwordHash,
      ]
    );

    const [doctorResult] = await conn.query(
      `
      INSERT INTO doctors (
        user_id,
        department_id,
        specialization,
        license_number,
        consultation_fee,
        biography,
        availability_status
      )
      VALUES (?, ?, ?, ?, ?, ?, 'available')
      `,
      [
        userResult.insertId,
        departmentId,
        specialization,
        licenseNumber || null,
        Number(consultationFee) || 0,
        biography || null,
      ]
    );

    await conn.commit();

    res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      data: {
        id: doctorResult.insertId,
        userId: userResult.insertId,
      },
    });

  } catch (err) {
    try {
      await conn.rollback();
    } catch (_) {}

    next(err);
  } finally {
    conn.release();
  }
}


/**
 * PATCH /api/doctors/:id/status
 *
 * Admin can update any doctor.
 * Doctor can update only their own status.
 */
async function updateDoctorStatus(req, res, next) {
  try {
    const { status } = req.body;

    const validStatuses = [
      "available",
      "unavailable",
      "on_leave",
    ];

    if (!validStatuses.includes(status)) {
      throw new ApiError(
        400,
        "Invalid status. Allowed values: available, unavailable, on_leave"
      );
    }

    const [[doctor]] = await pool.query(
      `
      SELECT
        d.id,
        d.user_id
      FROM doctors d
      WHERE d.id = ?
      LIMIT 1
      `,
      [req.params.id]
    );

    if (!doctor) {
      throw new ApiError(
        404,
        "Doctor not found"
      );
    }

    // A doctor may update only their own profile.
    if (
      req.user.role === "doctor" &&
      Number(doctor.user_id) !== Number(req.user.id)
    ) {
      throw new ApiError(
        403,
        "You can only update your own doctor status"
      );
    }

    await pool.query(
      `
      UPDATE doctors
      SET availability_status = ?
      WHERE id = ?
      `,
      [status, req.params.id]
    );

    res.json({
      success: true,
      message: "Doctor status updated successfully",
      data: {
        status,
      },
    });
  } catch (err) {
    next(err);
  }
}


/**
 * PATCH /api/doctors/:id
 *
 * Admin can update any doctor.
 * Doctor can update only their own profile.
 */
async function updateDoctor(req, res, next) {
  try {
    const {
      specialization,
      licenseNumber,
      consultationFee,
      biography,
      availabilityStatus,
    } = req.body;

    const [[doctor]] = await pool.query(
      `
      SELECT
        d.id,
        d.user_id
      FROM doctors d
      WHERE d.id = ?
      LIMIT 1
      `,
      [req.params.id]
    );

    if (!doctor) {
      throw new ApiError(
        404,
        "Doctor not found"
      );
    }

    if (
      req.user.role === "doctor" &&
      Number(doctor.user_id) !== Number(req.user.id)
    ) {
      throw new ApiError(
        403,
        "You can only update your own doctor profile"
      );
    }

    if (availabilityStatus) {
      const validStatuses = [
        "available",
        "unavailable",
        "on_leave",
      ];

      if (!validStatuses.includes(availabilityStatus)) {
        throw new ApiError(
          400,
          "Invalid availability status"
        );
      }
    }

    await pool.query(
      `
      UPDATE doctors
      SET
        specialization = COALESCE(?, specialization),
        license_number = COALESCE(?, license_number),
        consultation_fee = COALESCE(?, consultation_fee),
        biography = COALESCE(?, biography),
        availability_status = COALESCE(?, availability_status)
      WHERE id = ?
      `,
      [
        specialization ?? null,
        licenseNumber ?? null,
        consultationFee !== undefined
          ? Number(consultationFee)
          : null,
        biography ?? null,
        availabilityStatus ?? null,
        req.params.id,
      ]
    );

    res.json({
      success: true,
      message: "Doctor profile updated successfully",
    });
  } catch (err) {
    next(err);
  }
}


/**
 * DELETE /api/doctors/:id
 * Admin removes a doctor.
 */
async function deleteDoctor(req, res, next) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [[doctor]] = await conn.query(
      `
      SELECT user_id
      FROM doctors
      WHERE id = ?
      LIMIT 1
      `,
      [req.params.id]
    );

    if (!doctor) {
      throw new ApiError(
        404,
        "Doctor not found"
      );
    }

    /*
     * doctors.user_id has ON DELETE CASCADE,
     * so deleting the user also deletes the doctor profile.
     *
     * Existing appointments have ON DELETE RESTRICT
     * on doctor_id, so we must not delete a doctor
     * who still has appointments.
     */
    const [[appointments]] = await conn.query(
      `
      SELECT COUNT(*) AS count
      FROM appointments
      WHERE doctor_id = ?
        AND status NOT IN ('cancelled', 'no_show')
      `,
      [req.params.id]
    );

    if (Number(appointments.count) > 0) {
      throw new ApiError(
        409,
        "This doctor has active appointments and cannot be deleted"
      );
    }

    await conn.query(
      `
      DELETE FROM users
      WHERE id = ?
      `,
      [doctor.user_id]
    );

    await conn.commit();

    res.json({
      success: true,
      message: "Doctor removed successfully",
    });

  } catch (err) {
    try {
      await conn.rollback();
    } catch (_) {}

    next(err);
  } finally {
    conn.release();
  }
}


module.exports = {
  getAllDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  updateDoctorStatus,
  deleteDoctor,
};
