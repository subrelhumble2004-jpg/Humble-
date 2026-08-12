-- ============================================================
-- MEDQUEUE PRO
-- Hospital Appointment & Queue Management System
-- MySQL 8+
-- ============================================================

-- IMPORTANT:
-- Railway already creates the database.
-- DO NOT use CREATE DATABASE here.
-- This file creates the tables inside Railway's selected database.

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- USERS
-- ============================================================

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS queue_tickets;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30),

    password_hash VARCHAR(255) NOT NULL,

    role ENUM(
        'patient',
        'doctor',
        'admin'
    ) NOT NULL DEFAULT 'patient',

    gender ENUM(
        'male',
        'female',
        'other'
    ) DEFAULT NULL,

    date_of_birth DATE DEFAULT NULL,

    address VARCHAR(255) DEFAULT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_user_email (email),

    INDEX idx_users_role (role),
    INDEX idx_users_phone (phone),
    INDEX idx_users_active (is_active)
);


-- ============================================================
-- DEPARTMENTS
-- ============================================================

CREATE TABLE departments (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    name VARCHAR(150) NOT NULL,
    description TEXT,

    location VARCHAR(255) DEFAULT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_department_name (name),

    INDEX idx_department_active (is_active)
);


-- ============================================================
-- DOCTORS
-- ============================================================

CREATE TABLE doctors (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id INT UNSIGNED NOT NULL,
    department_id INT UNSIGNED NOT NULL,

    specialization VARCHAR(150) NOT NULL,

    license_number VARCHAR(100) DEFAULT NULL,

    consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    biography TEXT DEFAULT NULL,

    availability_status ENUM(
        'available',
        'unavailable',
        'on_leave'
    ) NOT NULL DEFAULT 'available',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_doctor_user (user_id),

    UNIQUE KEY unique_license_number (license_number),

    INDEX idx_doctor_department (department_id),
    INDEX idx_doctor_status (availability_status),

    CONSTRAINT fk_doctor_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_doctor_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


-- ============================================================
-- APPOINTMENTS
-- ============================================================

CREATE TABLE appointments (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    patient_id INT UNSIGNED NOT NULL,
    doctor_id INT UNSIGNED NOT NULL,
    department_id INT UNSIGNED NOT NULL,

    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,

    reason TEXT DEFAULT NULL,

    status ENUM(
        'pending',
        'confirmed',
        'completed',
        'cancelled',
        'no_show'
    ) NOT NULL DEFAULT 'pending',

    notes TEXT DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    INDEX idx_appointment_patient (patient_id),
    INDEX idx_appointment_doctor (doctor_id),
    INDEX idx_appointment_department (department_id),
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_appointment_status (status),

    CONSTRAINT fk_appointment_patient
        FOREIGN KEY (patient_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_appointment_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_appointment_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


-- ============================================================
-- QUEUE TICKETS
-- ============================================================

CREATE TABLE queue_tickets (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    appointment_id INT UNSIGNED DEFAULT NULL,
    patient_id INT UNSIGNED NOT NULL,
    doctor_id INT UNSIGNED DEFAULT NULL,
    department_id INT UNSIGNED NOT NULL,

    ticket_number VARCHAR(50) NOT NULL,

    queue_date DATE NOT NULL,

    queue_position INT UNSIGNED DEFAULT NULL,

    status ENUM(
        'waiting',
        'called',
        'serving',
        'completed',
        'cancelled',
        'skipped'
    ) NOT NULL DEFAULT 'waiting',

    checked_in_at DATETIME DEFAULT NULL,
    called_at DATETIME DEFAULT NULL,
    served_at DATETIME DEFAULT NULL,
    completed_at DATETIME DEFAULT NULL,

    estimated_wait_minutes INT UNSIGNED DEFAULT NULL,

    notes TEXT DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY unique_ticket_number_date (
        ticket_number,
        queue_date
    ),

    INDEX idx_queue_patient (patient_id),
    INDEX idx_queue_doctor (doctor_id),
    INDEX idx_queue_department (department_id),
    INDEX idx_queue_date (queue_date),
    INDEX idx_queue_status (status),
    INDEX idx_queue_position (queue_position),

    CONSTRAINT fk_queue_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES appointments(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_queue_patient
        FOREIGN KEY (patient_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_queue_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_queue_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id INT UNSIGNED NOT NULL,

    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,

    type ENUM(
        'appointment',
        'queue',
        'system',
        'reminder'
    ) NOT NULL DEFAULT 'system',

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    INDEX idx_notification_user (user_id),
    INDEX idx_notification_read (is_read),
    INDEX idx_notification_created (created_at),

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- ============================================================
-- SAMPLE DEPARTMENTS
-- ============================================================

INSERT INTO departments
    (name, description, location)
VALUES
    (
        'General Medicine',
        'General medical consultation and primary healthcare services.',
        'Main Hospital'
    ),
    (
        'Cardiology',
        'Diagnosis and treatment of heart and cardiovascular conditions.',
        'Specialist Wing'
    ),
    (
        'Pediatrics',
        'Healthcare services for infants, children and adolescents.',
        'Children Wing'
    ),
    (
        'Emergency',
        'Emergency medical assessment and treatment.',
        'Emergency Unit'
    ),
    (
        'Dental',
        'Dental consultation, treatment and oral healthcare.',
        'Dental Clinic'
    ),
    (
        'Obstetrics and Gynecology',
        'Women health, pregnancy and reproductive healthcare services.',
        'Women Health Unit'
    );


-- ============================================================
-- OPTIONAL DEMO ADMIN
-- ============================================================
--
-- DO NOT insert a plain-text password here.
-- Your application should create users through the registration
-- endpoint and hash passwords with bcrypt.
--
-- Example:
--
-- INSERT INTO users
-- (full_name, email, password_hash, role)
-- VALUES
-- ('System Administrator',
--  'admin@medqueuepro.com',
--  '$2b$10$YOUR_BCRYPT_HASH_HERE',
--  'admin');


-- ============================================================
-- FOREIGN KEYS BACK ON
-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
-- VERIFICATION
-- ============================================================

SELECT 'MedQueue Pro database schema loaded successfully'
    AS message;

SHOW TABLES;
