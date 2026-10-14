const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const studentController = require('../controllers/studentController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// Configure multer storage
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Profile endpoints
router.get('/profile', studentController.getProfile);
router.put('/profile', authorizeRoles('Applicant / Beneficiary', 'Parent / Guardian', 'Admin'), studentController.updateProfile);

// Document & Photo uploads
router.post('/upload-results', authorizeRoles('Applicant / Beneficiary', 'Parent / Guardian', 'Admin'), upload.single('resultDocument'), studentController.uploadResults);
router.post('/upload-photo', authorizeRoles('Applicant / Beneficiary', 'Parent / Guardian', 'Admin'), upload.single('photo'), studentController.uploadPhoto);
router.get('/documents', studentController.getDocuments);

// Student ID card
router.get('/id-card', studentController.getIdCardData);

// Application submission
router.post('/apply', authorizeRoles('Applicant / Beneficiary', 'Parent / Guardian'), studentController.applyOpportunity);

module.exports = router;
