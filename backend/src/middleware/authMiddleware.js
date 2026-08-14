const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'smart_ration_jwt_secret_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token missing or unauthorized' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid or expired access token' });
    }
    req.user = user;
    next();
  });
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.category !== role) {
      return res.status(403).json({ success: false, error: `Access denied. ${role} role required.` });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET
};
