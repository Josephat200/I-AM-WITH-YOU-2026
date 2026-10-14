const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', messageController.getMessages);
router.get('/:id', messageController.getMessageById);
router.post('/', authorizeRoles('Admin', 'Secretary', 'Sponsor / Funding Organization'), messageController.sendMessage);

module.exports = router;
