const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ikodi_super_secure_jwt_secret_token_2026';

/**
 * Middleware to authenticate requests via JWT Bearer Token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // If no token is provided, check for demo role header
    const demoRole = req.headers['x-demo-role'];
    if (demoRole) {
      req.user = {
        id: 'demo-user-id',
        email: 'demo@ikodi.org',
        fullName: 'Demo User',
        role: demoRole
      };
      return next();
    }
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // Fallback: If token expired or invalid in dev/demo mode
    if (req.headers['x-demo-role']) {
      req.user = {
        id: 'demo-user-id',
        email: 'demo@ikodi.org',
        fullName: 'Demo User',
        role: req.headers['x-demo-role']
      };
      return next();
    }
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

    // Role matching (supports partial matching like 'Admin' matching 'Admin')
    const hasRole = roles.some(role => 
      role === userRole || userRole.toLowerCase().includes(role.toLowerCase())
    );

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
