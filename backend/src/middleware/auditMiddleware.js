const { store } = require('../config/db');

/**
 * Middleware to track user actions, timestamps, IP addresses, and session activities
 */
function auditMiddleware(actionDescription, eventType = 'System') {
  return (req, res, next) => {
    // Execute request first
    res.on('finish', () => {
      // Only log on successful requests (2xx or 3xx)
      if (res.statusCode >= 200 && res.statusCode < 400) {
        const actor = req.user ? req.user.fullName : (req.body?.email || 'Anonymous');
        const role = req.user ? req.user.role : 'Guest';
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const userAgent = req.headers['user-agent'] || 'Unknown Client';
        
        const now = new Date();
        const timeFormatted = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        const logEntry = {
          id: Date.now(),
          actor: actor,
          action: typeof actionDescription === 'function' ? actionDescription(req) : (actionDescription || `${req.method} ${req.originalUrl}`),
          time: `Today, ${timeFormatted}`,
          device: `${ip.includes('::1') ? 'Localhost' : ip} · ${userAgent.includes('Chrome') ? 'Chrome' : 'Client'}`,
          type: eventType
        };

        store.auditLogs.unshift(logEntry);
        // Keep last 100 entries
        if (store.auditLogs.length > 100) {
          store.auditLogs.pop();
        }
      }
    });

    next();
  };
}

module.exports = {
  auditMiddleware
};
