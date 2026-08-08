const express = require("express");
const {
  getDashboardStats, getAllPatients, deactivateUser, activateUser, getAuditLogs,
} = require("../controllers/adminController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();
router.use(protect, restrictTo("admin"));

router.get("/stats", getDashboardStats);
router.get("/patients", getAllPatients);
router.patch("/users/:id/deactivate", deactivateUser);
router.patch("/users/:id/activate", activateUser);
router.get("/audit-logs", getAuditLogs);

module.exports = router;
