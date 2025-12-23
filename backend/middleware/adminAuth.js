import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export const adminAuth = async (req, res, next) => {
  try {
    
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
    await adminAuth(req, res, () => {});

    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({ message: 'Super admin access required' });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Super admin authentication failed' });
  }
};