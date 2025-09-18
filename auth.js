const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  console.log('Auth header:', authHeader);
  console.log('Extracted token:', token ? token.substring(0, 20) + '...' : 'No token');

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      details: 'No authorization header or token provided'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
    if (err) {
      console.error('JWT verification failed:', err.message);
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        details: err.message
      });
    }

    console.log('Token decoded successfully:', {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    });

    req.user = decoded;
    next();
  });
};

// Middleware to check if user has required role
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    console.log(`Checking role: required=${requiredRole}, user=${req.user?.role}`);
    
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        details: 'User not authenticated'
      });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        details: `Required role: ${requiredRole}, User role: ${req.user.role}`
      });
    }

    next();
  };
};

// Middleware to check if user has any of the required roles
const requireAnyRole = (roles) => {
  return (req, res, next) => {
    console.log(`Checking roles: required=${roles.join(', ')}, user=${req.user?.role}`);
    
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        details: 'User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        details: `Required roles: ${roles.join(', ')}, User role: ${req.user.role}`
      });
    }

    next();
  };
};

// Example login route (replace with your real DB logic)
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  // TODO: Replace with real DB lookup and password check
  if (username === 'admin' && password === 'admin') {
  const token = jwt.sign({ id: 1, username, role: 'superadmin' }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '30m' });
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

// Example protected route
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
module.exports.requireRole = requireRole;
module.exports.requireAnyRole = requireAnyRole;