const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

router.get('/assignments', reviewController.getAssignedApplications);
router.post('/evaluate', reviewController.evaluateCandidate);

module.exports = router;
