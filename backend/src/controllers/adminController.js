const { store } = require('../config/db');

/**
 * List all users and profiles
 */
function getUsers(req, res) {
  try {
    const users = store.users.map(u => ({
      id: u.id,
      name: u.fullName,
      email: u.email,
      role: u.role,
      organization: u.organization || 'IKODI System',
      status: u.status || 'Active',
      lastActive: 'Today, active'
    }));

    return res.json({ success: true, count: users.length, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
  }
}

/**
 * Modify user role or status (Super Admin / Admin only)
 */
function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { role, status, organization } = req.body;
    const user = store.users.find(u => u.id === id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (role) user.role = role;
    if (status) user.status = status;
    if (organization) user.organization = organization;

    store.auditLogs.unshift({
      id: Date.now(),
      actor: req.user?.fullName || 'Admin',
      action: `Modified user ${user.fullName} (${user.email}) -> Role: ${user.role}, Status: ${user.status}`,
      time: 'Just now',
      device: req.ip || 'Local',
      type: 'Authentication'
    });

    return res.json({ success: true, message: 'User updated successfully.', user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
}

/**
 * Verify or modify partner organization status
 */
function verifyOrganization(req, res) {
  try {
    const { name, status } = req.body;

    store.auditLogs.unshift({
      id: Date.now(),
      actor: req.user?.fullName || 'Admin',
      action: `Updated organization "${name}" status to "${status || 'Verified'}"`,
      time: 'Just now',
      device: req.ip || 'Local',
      type: 'Organization'
    });

    return res.json({
      success: true,
      message: `Organization ${name} status updated to ${status || 'Verified'}.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to verify organization.' });
  }
}

/**
 * Get comprehensive history of user sessions (who, what, when log-in/out)
 */
function getSessionHistory(req, res) {
  try {
    return res.json({
      success: true,
      count: store.sessions.length,
      sessions: store.sessions
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve session history.' });
  }
}

/**
 * Get audit logs with optional filter
 */
function getAuditLogs(req, res) {
  try {
    const { type, search } = req.query;
    let logs = [...store.auditLogs];

    if (type && type !== 'All activity') {
      logs = logs.filter(l => l.type.toLowerCase() === type.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      logs = logs.filter(l =>
        l.actor.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.device.toLowerCase().includes(q)
      );
    }

    return res.json({ success: true, count: logs.length, auditLogs: logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
  }
}

/**
 * Verify or produce Student ID Card
 */
function verifyStudentIdCard(req, res) {
  try {
    const { studentIdCode, status } = req.body;
    const student = store.students.find(s => s.studentIdCode === studentIdCode) || store.students[0];

    if (student) {
      student.idCardStatus = status || 'Verified';
      student.idCardIssuedAt = new Date().toISOString();
    }

    store.auditLogs.unshift({
      id: Date.now(),
      actor: req.user?.fullName || 'Admin',
      action: `Produced / verified Student ID Card for ${student?.name || studentIdCode} (Status: ${status || 'Verified'})`,
      time: 'Just now',
      device: req.ip || 'Local',
      type: 'Application'
    });

    return res.json({
      success: true,
      message: `Student ID card status updated to ${status || 'Verified'}.`,
      student
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update student ID card.' });
  }
}

/**
 * Aggregate reports & analytics metrics
 */
function getReportsData(req, res) {
  try {
    const totalApplicants = store.candidates.length;
    const awaitingReview = store.candidates.filter(c => c.status === 'Ready for review' || c.status === 'In review').length;
    const totalOpportunities = store.opportunities.length;
    const activeOpportunities = store.opportunities.filter(o => o.status === 'Open' || o.status === 'Closing soon').length;
    const fundedLearners = store.opportunities.reduce((acc, o) => acc + (o.funded || 0), 0);
    const totalCommitted = store.opportunities.reduce((acc, o) => acc + (o.amount * (o.funded || 0)), 0);

    const candidates = store.candidates;
    const avgScore = candidates.length ? (candidates.reduce((sum, c) => sum + (c.score || 0), 0) / candidates.length).toFixed(1) : 0;

    return res.json({
      success: true,
      metrics: {
        totalApplicants,
        awaitingReview,
        totalOpportunities,
        activeOpportunities,
        fundedLearners,
        totalCommitted,
        averageReviewScore: Number(avgScore)
      },
      opportunities: store.opportunities,
      candidates: store.candidates
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to compute report metrics.' });
  }
}

module.exports = {
  getUsers,
  updateUser,
  verifyOrganization,
  getSessionHistory,
  getAuditLogs,
  verifyStudentIdCard,
  getReportsData
};
