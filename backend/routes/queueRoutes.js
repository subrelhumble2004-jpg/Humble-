const express = require("express");
const { getDepartmentQueue, getMyQueuePosition, advanceQueue } = require("../controllers/queueController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.get("/:departmentId", getDepartmentQueue);
router.get("/appointment/:appointmentId/position", getMyQueuePosition);
router.patch("/:appointmentId/advance", protect, restrictTo("doctor", "admin"), advanceQueue);

module.exports = router;
