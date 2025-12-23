import { verifyAccessToken } from '../utils/tokenUtils.js';

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('🔐 Auth Middleware - Header:', authHeader?.substring(0, 20) + '...');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token or wrong format');
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    console.log('🔑 Verifying token...');
    const decoded = verifyAccessToken(token);
    console.log('✅ Token decoded:', decoded?.id);

    if (!decoded) {
      console.log('❌ Invalid token');
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    if (decoded.type !== 'access') {
      console.log('❌ Wrong token type:', decoded.type);
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    console.log('✅ Token valid, proceeding...');
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.log('❌ Auth error:', error.message);
    res.status(401).json({ success: false, message: 'Authentication failed', error: error.message });
  }
};

export default authMiddleware;
