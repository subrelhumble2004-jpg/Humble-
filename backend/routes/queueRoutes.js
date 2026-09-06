const express = require("express");

const {
  getDepartmentQueue,
  getMyQueuePosition,
  advanceQueue
} = require("../controllers/queueController");

const {
  protect,
  restrictTo
} = require("../middleware/auth");

const router = express.Router();

// Live department queue
// Public access is intentionally not required for the queue display.
router.get("/:departmentId", getDepartmentQueue);

// Patient's queue position
// Authentication is required because this contains patient-specific information.
router.get(
  "/appointment/:appointmentId/position",
  protect,
  restrictTo("patient", "doctor", "admin"),
  getMyQueuePosition
);

// Doctor/Admin can advance the queue
router.patch(
  "/:appointmentId/advance",
  protect,
  restrictTo("doctor", "admin"),
  advanceQueue
);

module.exports = router;
