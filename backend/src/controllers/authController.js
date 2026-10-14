const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { store, query, isLiveDatabase } = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const publicUser = u => ({
  id: u.id, email: u.email, fullName: u.full_name || u.fullName,
  role: u.role, organization: u.organization, phone: u.phone || '',
  status: u.status
});

function tokenFor(user) {
  return jwt.sign({ id: user.id, email: user.email, fullName: user.full_name || user.fullName, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

async function register(req, res) {
  try {
    const { email, password, fullName, role, organization, phone } = req.body;
    if (!email || !password || !fullName || !role) return res.status(400).json({ success: false, message: 'Please provide email, password, fullName, and role.' });
    if (!['Applicant / Beneficiary', 'Parent / Guardian'].includes(role)) return res.status(403).json({ success: false, message: 'Only students and parents/guardians can create accounts.' });
    if (String(password).length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    const hash = await bcrypt.hash(password, 10);
    if (isLiveDatabase()) {
      const result = await query(`INSERT INTO users (email,password_hash,full_name,role,organization,phone) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [email.toLowerCase(), hash, fullName, role, organization || 'General User', phone || null]);
      const user = result.rows[0];
      return res.status(201).json({ success: true, message: 'Account registered successfully.', token: tokenFor(user), user: publicUser(user) });
    }
    if (store.users.some(u => u.email.toLowerCase() === email.toLowerCase())) return res.status(409).json({ success: false, message: 'A user with this email address already exists.' });
    const user = { id: `usr-${Date.now()}`, email: email.toLowerCase(), passwordHash: hash, fullName, role, organization: organization || 'General User', phone: phone || '', status: 'Active' };
    store.users.push(user);
    return res.status(201).json({ success: true, message: 'Account registered successfully.', token: tokenFor(user), user: publicUser(user) });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success: false, message: 'A user with this email address already exists.' });
    console.error('[Register Error]', err); return res.status(500).json({ success: false, message: 'Internal server error while registering user.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required.' });
    let user;
    if (isLiveDatabase()) user = (await query('SELECT * FROM users WHERE lower(email)=lower($1) LIMIT 1', [email])).rows[0];
    else user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.password_hash || user.passwordHash || ''))) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    const u = publicUser(user);
    if (isLiveDatabase()) await query('INSERT INTO sessions (user_id,ip_address,user_agent,device_label) VALUES ($1,$2,$3,$4)', [user.id, req.ip, req.get('user-agent'), req.get('user-agent')?.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser']);
    return res.json({ success: true, message: 'Logged in successfully.', token: tokenFor(user), user: u });
  } catch (err) {
    console.error('[Login Error]', err); return res.status(500).json({ success: false, message: 'Internal server error while logging in.' });
  }
}

async function logout(req, res) {
  try {
    if (isLiveDatabase()) await query('UPDATE sessions SET is_active=false,logout_time=NOW() WHERE user_id=$1 AND is_active=true', [req.user.id]);
    else { const s = store.sessions.find(x => x.userId === req.user.id && x.isActive); if (s) { s.isActive = false; s.logoutTime = new Date().toISOString(); } }
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) { return res.status(500).json({ success: false, message: 'Logout failed.' }); }
}

async function getMe(req, res) {
  try {
    const user = isLiveDatabase() ? (await query('SELECT * FROM users WHERE id=$1', [req.user.id])).rows[0] : store.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, user: publicUser(user) });
  } catch (err) { return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' }); }
}
module.exports = { register, login, logout, getMe };
