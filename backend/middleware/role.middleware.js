const { prisma } = require('../config/prisma');

/**
 * Middleware to verify if user has admin role
 */
const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    const userRoles = await prisma.userrole.findMany({
      where: { user_id: req.user.id }
    });
    
    if (!userRoles.some(role => role.role === 'admin')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin role required.' 
      });
    }
    
    next();
  } catch (error) {
    console.error('isAdmin middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
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

/**
 * Middleware to verify if user is an investor
 */
const isInvestor = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    const investor = await prisma.investor.findUnique({
      where: { user_id: req.user.id }
    });
    
    if (!investor) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. User is not an investor.' 
      });
    }
    
    req.investor = investor;
    next();
  } catch (error) {
    console.error('isInvestor middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

module.exports = {
  isAdmin,
  isIssuer,
  isInvestor
}; 