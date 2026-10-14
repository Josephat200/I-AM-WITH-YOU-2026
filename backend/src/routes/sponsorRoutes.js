const express = require('express');
const router = express.Router();
const sponsorController = require('../controllers/sponsorController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/opportunities', authorizeRoles('Sponsor / Funding Organization', 'Admin', 'Secretary'), sponsorController.getOpportunities);
router.post('/opportunities', authorizeRoles('Sponsor / Funding Organization', 'Admin'), sponsorController.createOpportunity);
router.put('/opportunities/:id', authorizeRoles('Sponsor / Funding Organization', 'Admin'), sponsorController.updateOpportunity);
router.get('/opportunities/:id/applicants', authorizeRoles('Sponsor / Funding Organization', 'Admin', 'Reviewer / Selection Committee'), sponsorController.getApplicants);
router.post('/beneficiaries/award', authorizeRoles('Sponsor / Funding Organization', 'Admin'), sponsorController.selectBeneficiary);
router.get('/funded-students', authorizeRoles('Sponsor / Funding Organization', 'Admin', 'Secretary'), sponsorController.getFundedStudents);

module.exports = router;
