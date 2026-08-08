const express = require("express");
const {
  getAllDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment,
} = require("../controllers/departmentController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.get("/", getAllDepartments);
router.get("/:id", getDepartment);
router.post("/", protect, restrictTo("admin"), createDepartment);
router.patch("/:id", protect, restrictTo("admin"), updateDepartment);
router.delete("/:id", protect, restrictTo("admin"), deleteDepartment);

module.exports = router;
