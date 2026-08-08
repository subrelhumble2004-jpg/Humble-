const express = require("express");
const {
  bookAppointment, getMyAppointments, getDoctorAppointments, getAllAppointments,
  cancelAppointment, rescheduleAppointment, updateAppointmentStatus,
} = require("../controllers/appointmentController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, restrictTo("patient"), bookAppointment);
router.get("/me", protect, restrictTo("patient"), getMyAppointments);
router.get("/doctor/:doctorId", protect, restrictTo("doctor", "admin"), getDoctorAppointments);
router.get("/", protect, restrictTo("admin"), getAllAppointments);
router.patch("/:id/cancel", protect, cancelAppointment);
router.patch("/:id/reschedule", protect, rescheduleAppointment);
router.patch("/:id/status", protect, restrictTo("doctor", "admin"), updateAppointmentStatus);

module.exports = router;
