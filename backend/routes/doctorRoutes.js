const express = require("express");
const {
  getAllDoctors, getDoctor, createDoctor, updateDoctor, updateDoctorStatus, deleteDoctor,
} = require("../controllers/doctorController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.get("/", getAllDoctors);
router.get("/:id", getDoctor);
router.post("/", protect, restrictTo("admin"), createDoctor);
router.patch("/:id", protect, restrictTo("admin", "doctor"), updateDoctor);
router.patch("/:id/status", protect, restrictTo("admin", "doctor"), updateDoctorStatus);
router.delete("/:id", protect, restrictTo("admin"), deleteDoctor);

module.exports = router;
