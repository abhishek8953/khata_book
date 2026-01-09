import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export const adminAuth = async (req, res, next) => {
  try {
    console.log("req",req.header("Authorization"));
    const token = req.header('Authorization')?.replace('Bearer ', '');
  
    if (!token) {
      return res.status(401).json({ message: 'Admin authentication required' });
    }

    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || 'admin_secret_key');
    
    const admin = await Admin.findOne({ _id: decoded.id, isActive: true });
    
    if (!admin) {
      return res.status(401).json({ message: 'Admin not found or inactive' });
    }
    
    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid admin token' });
  }
};

export const superAdminAuth = async (req, res, next) => {
  try {
    console.log("req",req.header("Authorization"));
    // Don't call adminAuth directly - extract the logic
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Super admin authentication required' });
    }

    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || 'admin_secret_key');
    
    const admin = await Admin.findOne({ 
      _id: decoded.id, 
      isActive: true,
      role: 'super_admin' // Check role here
    });
    
    if (!admin) {
      return res.status(401).json({ 
        message: 'Super admin not found or insufficient privileges' 
      });
    }
    
    req.admin = admin;
    next();
  } catch (error) {
    console.error('Super admin auth error:', error.message);
    return res.status(401).json({ 
      message: 'Invalid super admin token',
      error: error.message 
    });
  }
};