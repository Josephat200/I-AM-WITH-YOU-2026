const { store } = require('../config/db');

/**
 * Get all messages for current context/audience
 */
function getMessages(req, res) {
  try {
    const { channel, audience } = req.query;
    let list = [...store.messages];

    if (channel && channel !== 'All') {
      list = list.filter(m => m.channel.toLowerCase() === channel.toLowerCase());
    }

    if (audience && audience !== 'All') {
      list = list.filter(m => m.audience.toLowerCase().includes(audience.toLowerCase()));
    }

    return res.json({ success: true, count: list.length, messages: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve messages.' });
  }
}

/**
 * Get single message by ID
 */
function getMessageById(req, res) {
  try {
    const { id } = req.params;
    const msg = store.messages.find(m => m.id === Number(id));

    if (!msg) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    return res.json({ success: true, message: msg });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve message.' });
  }
}

/**
 * Compose and dispatch message (In-app, simulated Email, SMS)
 */
function sendMessage(req, res) {
  try {
    const { subject, body, audience, channel, sender } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ success: false, message: 'Subject and body are required.' });
    }

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const newMsg = {
      id: Date.now(),
      subject,
      body,
      audience: audience || 'Selected student',
      channel: channel || 'In-app',
      date: `Today, ${timeFormatted}`,
      status: channel === 'In-app' ? 'Delivered' : 'Simulated',
      sender: sender || req.user?.fullName || 'IKODI Secretariat'
    };

    store.messages.unshift(newMsg);

    store.auditLogs.unshift({
      id: Date.now(),
      actor: newMsg.sender,
      action: `Dispatched ${newMsg.channel} message to "${newMsg.audience}": "${subject}"`,
      time: 'Just now',
      device: req.ip || 'Local',
      type: 'System'
    });

    return res.status(201).json({
      success: true,
      message: `Message dispatched via ${newMsg.channel} to ${newMsg.audience}.`,
      data: newMsg
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
}

module.exports = {
  getMessages,
  getMessageById,
  sendMessage
};
