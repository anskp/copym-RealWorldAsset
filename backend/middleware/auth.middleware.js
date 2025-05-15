const jwt = require('jsonwebtoken');
const { prisma } = require('../config/prisma');

/**
 * Middleware to verify if user is authenticated
 */
const isAuthenticated = async (req, res, next) => {
  try {
    // Check if user is already authenticated by Passport
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }
    
    // Check for JWT token in Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }
    
    const token = authHeader.substring(7);
    
    try {
      // Verify the token
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.warn('JWT_SECRET not set in environment. Using default secret in auth middleware.');
      }
      const decoded = jwt.verify(token, secret || 'AKLjhdftfyhgjbhvUGYIU878788yjhgvasjRES');
      
      // Find the user
      const user = await prisma.users.findUnique({
        where: { id: decoded.userId },
        include: { userrole: true }
      });
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token. User not found.' 
        });
      }
      
      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token.' 
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

/**
 * Middleware to verify if user has a specific role
 */
const hasRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    const userRoles = req.user.userrole.map(r => r.role);
    
    if (!userRoles.includes(role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Required role: ' + role 
      });
    }
    
    next();
  };
};

/**
 * Middleware to verify if user is an issuer
 */
const isIssuer = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    const issuer = await prisma.issuer.findUnique({
      where: { user_id: req.user.id }
    });
    
    if (!issuer) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. User is not an issuer.' 
      });
    }
    
    req.issuer = issuer;
    next();
  } catch (error) {
    console.error('isIssuer middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

module.exports = {
  isAuthenticated,
  hasRole,
  isIssuer
}; 