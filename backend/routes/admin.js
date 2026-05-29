const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

// @route   GET api/admin/students
// @desc    Get all students and their latest assessments
// @access  Private (Admin only)
router.get('/students', auth, adminController.getAllStudents);

module.exports = router;
