const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);
router.post('/organizations/verify', adminController.verifyOrganization);
router.get('/sessions', adminController.getSessionHistory);
router.get('/audit-logs', adminController.getAuditLogs);
router.post('/id-card/verify', adminController.verifyStudentIdCard);
router.get('/reports', adminController.getReportsData);

module.exports = router;
