const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'ikodi_local_demo_secret');

/**
 * Middleware to authenticate requests via JWT Bearer Token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    if (!JWT_SECRET) {
      return res.status(500).json({ success: false, message: 'JWT_SECRET is not configured.' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
}

/**
 * Middleware for Role-Based Access Control (RBAC)
 * @param  {...string} roles Allowed roles
 */
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Please log in first.' });
    }

    const userRole = req.user.role;
    // Super Admin has universal access
    if (userRole === 'Super Admin') {
      return next();
    }

    const hasRole = roles.includes(userRole);

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${userRole}' does not have permission to access this resource.`
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
  JWT_SECRET
};
