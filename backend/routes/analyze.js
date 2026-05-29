const express = require('express');
const router = express.Router();
const multer = require('multer');
const analyzeController = require('../controllers/analyzeController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure Multer memory storage (we parse directly from the memory buffer)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post('/resume', authMiddleware, upload.single('resume'), analyzeController.analyzeResume);
router.post('/github', authMiddleware, analyzeController.analyzeGitHub);
router.post('/coding', authMiddleware, analyzeController.analyzeCoding);
router.post('/interview', authMiddleware, analyzeController.analyzeInterview);
router.get('/assessment', authMiddleware, analyzeController.getLatestAssessment);

module.exports = router;
