// backend/middleware/verifyToken.js
import jwt from 'jsonwebtoken';

const verifyTokenMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
    
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(403).json({ 
      error: 'Invalid or expired token.' 
    });
  }
};

export default verifyTokenMiddleware;