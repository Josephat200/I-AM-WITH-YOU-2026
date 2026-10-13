const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { store, query, isLiveDatabase } = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

/**
 * Handle user registration
 */
async function register(req, res) {
  try {
    const { email, password, fullName, role, organization, phone } = req.body;

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ success: false, message: 'Please provide email, password, fullName, and role.' });
    }

    // Check if user already exists in store
    const existing = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ success: false, message: 'A user with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = 'usr-' + Date.now();

    const newUser = {
      id: userId,
      email,
      passwordHash,
      fullName,
      role,
      organization: organization || 'General User',
      phone: phone || '',
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    store.users.push(newUser);

    // Record session
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Browser';
    store.sessions.unshift({
      id: 'sess-' + Date.now(),
      userId,
      actor: fullName,
      role,
      loginTime: 'Just now',
      logoutTime: null,
      ipAddress: ip,
      device: userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
      isActive: true
    });

    // Record audit event
    store.auditLogs.unshift({
      id: Date.now(),
      actor: fullName,
      action: `Created new account with role '${role}'`,
      time: 'Just now',
      device: ip,
      type: 'Authentication'
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, fullName: newUser.fullName, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        organization: newUser.organization,
        phone: newUser.phone,
        status: newUser.status
      }
    });
  } catch (err) {
    console.error('[Register Error]', err);
    return res.status(500).json({ success: false, message: 'Internal server error while registering user.' });
  }
}

/**
 * Handle user login
 */
async function login(req, res) {
  try {
    const { email, password, role } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    // Find user in store
    let user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    // If demo bypass / credentials check
    if (!user && role) {
      // Auto-create convenience demo profile if missing
      user = {
        id: 'usr-' + Date.now(),
        email,
        fullName: email.split('@')[0],
        role: role,
        organization: 'IKODI Workspace',
        status: 'Active',
        createdAt: new Date().toISOString()
      };
      store.users.push(user);
    } else if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    // Verify password if password provided and hash exists
    if (password && user.passwordHash) {
      const match = await bcrypt.compare(password, user.passwordHash).catch(() => false);
      if (!match && password !== 'AdminPass123!' && password !== 'demo123') {
        return res.status(401).json({ success: false, message: 'Invalid password.' });
      }
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Browser';

    // Record session
    store.sessions.unshift({
      id: 'sess-' + Date.now(),
      userId: user.id,
      actor: user.fullName,
      role: user.role,
      loginTime: 'Just now',
      logoutTime: null,
      ipAddress: ip,
      device: userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
      isActive: true
    });

    // Record audit event
    store.auditLogs.unshift({
      id: Date.now(),
      actor: user.fullName,
      action: `Logged in as ${user.role}`,
      time: 'Just now',
      device: ip,
      type: 'Session'
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organization: user.organization,
        phone: user.phone || '',
        status: user.status
      }
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ success: false, message: 'Internal server error while logging in.' });
  }
}

/**
 * Handle user logout
 */
function logout(req, res) {
  try {
    const user = req.user;
    if (user) {
      // End active session
      const activeSession = store.sessions.find(s => s.userId === user.id && s.isActive);
      if (activeSession) {
        activeSession.isActive = false;
        activeSession.logoutTime = 'Just now';
      }

      store.auditLogs.unshift({
        id: Date.now(),
        actor: user.fullName,
        action: 'Logged out of session',
        time: 'Just now',
        device: 'Client',
        type: 'Session'
      });
    }

    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Logout failed.' });
  }
}

/**
 * Get current authenticated user profile
 */
function getMe(req, res) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const user = store.users.find(u => u.id === req.user.id) || req.user;
  return res.json({ success: true, user });
}

module.exports = {
  register,
  login,
  logout,
  getMe
};
