const express = require('express');
const router = express.Router();
const roadmapController = require('../controllers/roadmapController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/generate', authMiddleware, roadmapController.generateRoadmap);
router.get('/current', authMiddleware, roadmapController.getCurrentRoadmap);
router.put('/task/:day/:taskIndex', authMiddleware, roadmapController.toggleTaskStatus);

module.exports = router;
