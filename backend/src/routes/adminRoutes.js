const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken, authorizeRoles('Admin', 'Secretary'));

router.get('/users', adminController.getUsers);
router.put('/users/:id', authorizeRoles('Admin'), adminController.updateUser);
router.post('/organizations/verify', authorizeRoles('Admin'), adminController.verifyOrganization);
router.get('/sessions', adminController.getSessionHistory);
router.get('/audit-logs', adminController.getAuditLogs);
router.post('/id-card/verify', authorizeRoles('Admin'), adminController.verifyStudentIdCard);
router.get('/reports', adminController.getReportsData);

module.exports = router;
