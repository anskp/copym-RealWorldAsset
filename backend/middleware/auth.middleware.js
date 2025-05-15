const jwt = require('jsonwebtoken');
const { prisma } = require('../config/prisma');

/**
 * Authentication middleware
 */
const authMiddleware = {
  /**
   * Check if the user is authenticated
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  isAuthenticated: async (req, res, next) => {
    try {
      // Get token from header
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          is_active: true
        }
      });
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      if (!user.is_active) {
        return res.status(401).json({ message: 'User account is inactive' });
      }
      
      // Add user to request object
      req.user = user;
      
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(401).json({ message: 'Token is not valid' });
    }
  },

  /**
   * Check if the user has admin role
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  isAdmin: (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
      next();
    } else {
      res.status(403).json({ message: 'Access denied. Admin role required' });
    }
  },

  /**
   * Check if the user has issuer role
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  isIssuer: async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Check if user has issuer role
      const issuer = await prisma.issuer.findFirst({
        where: { user_id: req.user.id }
      });

      if (!issuer) {
        return res.status(403).json({ message: 'Access denied. Issuer role required' });
      }

      // Add issuer data to request
      req.issuer = issuer;
      next();
    } catch (error) {
      console.error('Issuer auth middleware error:', error);
      res.status(500).json({ message: 'Server error in authorization' });
    }
  },

  /**
   * Check if the user has investor role
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  isInvestor: async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Check if user has investor role
      const investor = await prisma.investor.findFirst({
        where: { user_id: req.user.id }
      });

      if (!investor) {
        return res.status(403).json({ message: 'Access denied. Investor role required' });
      }

      // Add investor data to request
      req.investor = investor;
      next();
    } catch (error) {
      console.error('Investor auth middleware error:', error);
      res.status(500).json({ message: 'Server error in authorization' });
    }
  }
};

module.exports = authMiddleware;