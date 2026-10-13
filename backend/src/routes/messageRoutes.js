const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.get('/', messageController.getMessages);
router.get('/:id', messageController.getMessageById);
router.post('/', messageController.sendMessage);

module.exports = router;
