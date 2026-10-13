const express = require('express');
const router = express.Router();
const sponsorController = require('../controllers/sponsorController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/opportunities', sponsorController.getOpportunities);
router.post('/opportunities', sponsorController.createOpportunity);
router.put('/opportunities/:id', sponsorController.updateOpportunity);
router.get('/opportunities/:id/applicants', sponsorController.getApplicants);
router.post('/beneficiaries/award', sponsorController.selectBeneficiary);
router.get('/funded-students', sponsorController.getFundedStudents);

module.exports = router;
