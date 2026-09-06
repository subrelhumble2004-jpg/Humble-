const express = require("express");

const {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  getAllAppointments,
  cancelAppointment,
  rescheduleAppointment,
  updateAppointmentStatus,
} = require("../controllers/appointmentController");

const {
  protect,
  restrictTo,
} = require("../middleware/auth");

const router = express.Router();

// Patient booking
router.post(
  "/",
  protect,
  restrictTo("patient"),
  bookAppointment
);

// Patient's own appointments
router.get(
  "/me",
  protect,
  restrictTo("patient"),
  getMyAppointments
);

// Doctor/admin appointment schedule
router.get(
  "/doctor/:doctorId",
  protect,
  restrictTo("doctor", "admin"),
  getDoctorAppointments
);

// Admin: all appointments
router.get(
  "/",
  protect,
  restrictTo("admin"),
  getAllAppointments
);

// Patient/doctor/admin can request cancellation.
// Ownership/permission validation is handled inside the controller.
router.patch(
  "/:id/cancel",
  protect,
  restrictTo("patient", "doctor", "admin"),
  cancelAppointment
);

// Patient/doctor/admin can request rescheduling.
// Ownership/permission validation is handled inside the controller.
router.patch(
  "/:id/reschedule",
  protect,
  restrictTo("patient", "doctor", "admin"),
  rescheduleAppointment
);

// Doctor/admin can change appointment status
router.patch(
  "/:id/status",
  protect,
  restrictTo("doctor", "admin"),
  updateAppointmentStatus
);

module.exports = router;
