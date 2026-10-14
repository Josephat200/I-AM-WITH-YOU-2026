const { store, query, isLiveDatabase } = require('../config/db');
async function getMessages(req, res) {
  try {
    const { channel, audience } = req.query;
    const rows = isLiveDatabase() ? (await query(`SELECT id,sender_id,sender_name AS sender,audience,recipient_id,channel,subject,body,status,sent_at AS date FROM messages WHERE ($1::text IS NULL OR channel=$1) AND ($2::text IS NULL OR audience ILIKE '%'||$2||'%') ORDER BY sent_at DESC`, [channel && channel !== 'All' ? channel : null, audience && audience !== 'All' ? audience : null])).rows : store.messages;
    return res.json({ success: true, count: rows.length, messages: rows });
  } catch (err) { return res.status(500).json({ success: false, message: 'Failed to retrieve messages.' }); }
}
async function getMessageById(req, res) { try { const m = isLiveDatabase() ? (await query('SELECT id,sender_name AS sender,audience,channel,subject,body,status,sent_at AS date FROM messages WHERE id=$1', [req.params.id])).rows[0] : store.messages.find(x => String(x.id) === req.params.id); if (!m) return res.status(404).json({ success: false, message: 'Message not found.' }); return res.json({ success: true, message: m }); } catch (err) { return res.status(500).json({ success: false, message: 'Failed to retrieve message.' }); } }
async function sendMessage(req, res) {
  try {
    const { subject, body, audience = 'Selected student', channel = 'In-app', recipientId } = req.body;
    if (!subject || !body || !['In-app', 'Email', 'SMS'].includes(channel)) return res.status(400).json({ success: false, message: 'Valid subject, body, and channel are required.' });
    if (isLiveDatabase()) { const r = await query('INSERT INTO messages (sender_id,sender_name,audience,recipient_id,channel,subject,body,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [req.user.id, req.user.fullName, audience, recipientId || null, channel, subject, body, channel === 'In-app' ? 'Delivered' : 'Simulated']); return res.status(201).json({ success: true, data: r.rows[0] }); }
    const m = { id: Date.now(), subject, body, audience, channel, sender: req.user.fullName, status: channel === 'In-app' ? 'Delivered' : 'Simulated', date: new Date().toISOString() }; store.messages.unshift(m); return res.status(201).json({ success: true, data: m });
  } catch (err) { return res.status(500).json({ success: false, message: 'Failed to send message.' }); }
}
module.exports = { getMessages, getMessageById, sendMessage };
