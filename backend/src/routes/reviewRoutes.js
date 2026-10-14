const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/assignments', authorizeRoles('Reviewer / Selection Committee', 'Admin'), reviewController.getAssignedApplications);
router.post('/evaluate', authorizeRoles('Reviewer / Selection Committee', 'Admin'), reviewController.evaluateCandidate);

module.exports = router;
