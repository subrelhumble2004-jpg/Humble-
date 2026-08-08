-- ==========================================================
-- MedQueue Pro — Database Schema (MySQL 8+)
-- ==========================================================

CREATE DATABASE IF NOT EXISTS medqueue_pro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medqueue_pro;

-- ----------------------------
-- Departments
-- ----------------------------
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(10) NOT NULL UNIQUE,        -- e.g. CARD, NEURO, PEDS — used in queue numbers
  description TEXT,
  icon VARCHAR(50),
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------
-- Users (shared table; role differentiates patient/doctor/admin)
-- ----------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(30),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('patient','doctor','admin') NOT NULL DEFAULT 'patient',
  avatar_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  reset_token VARCHAR(255),
  reset_token_expires DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ----------------------------
-- Doctor profile (extends users where role = 'doctor')
-- ----------------------------
CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  department_id INT NOT NULL,
  specialization VARCHAR(150),
  bio TEXT,
  education TEXT,
  years_experience INT DEFAULT 0,
  consultation_fee DECIMAL(10,2) DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 5.0,
  status ENUM('available','in_session','off_duty') DEFAULT 'available',
  working_hours VARCHAR(150) DEFAULT 'Mon–Fri, 8:00 AM – 4:00 PM',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- ----------------------------
-- Patient profile (extends users where role = 'patient')
-- ----------------------------
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  date_of_birth DATE,
  gender ENUM('male','female','other'),
  address VARCHAR(255),
  blood_group VARCHAR(5),
  emergency_contact VARCHAR(30),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ----------------------------
-- Appointments
-- ----------------------------
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  department_id INT NOT NULL,
  queue_number VARCHAR(20) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time VARCHAR(20) NOT NULL,
  reason TEXT,
  status ENUM('pending','confirmed','in_session','completed','cancelled','missed') DEFAULT 'confirmed',
  qr_code_data VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  INDEX idx_appt_date (appointment_date),
  INDEX idx_appt_doctor_date (doctor_id, appointment_date)
);

-- ----------------------------
-- Queue log (tracks live status changes per appointment, per day)
-- ----------------------------
CREATE TABLE IF NOT EXISTS queue_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,
  status ENUM('waiting','in_session','completed','missed') DEFAULT 'waiting',
  position INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

-- ----------------------------
-- Medical records
-- ----------------------------
CREATE TABLE IF NOT EXISTS medical_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT,
  appointment_id INT,
  diagnosis TEXT,
  prescription TEXT,
  notes TEXT,
  attachment_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- ----------------------------
-- Notifications
-- ----------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150),
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ----------------------------
-- Audit trail (admin actions)
-- ----------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actor_id INT,
  action VARCHAR(150),
  entity VARCHAR(100),
  entity_id INT,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES users(id)
);
