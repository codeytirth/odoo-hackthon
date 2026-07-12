const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'transitops-super-secret-key-12345!';

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  // Demo mode: bypass auth and assume Fleet Manager
  req.user = { id: 1, email: 'manager@transitops.com', role: 'fleet_manager' };
  next();
}

// Middleware to authorize specific roles
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    // Demo mode: bypass role checks
    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
};
