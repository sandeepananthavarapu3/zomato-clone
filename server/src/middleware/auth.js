/**
 * JWT Authentication Middleware
 * 
 * Verifies the Bearer token in the Authorization header
 * and attaches the user object to req.user
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    if (decoded.role === 'restaurant') {
      const Restaurant = (await import('../models/Restaurant.js')).default;
      const resExists = await Restaurant.findById(decoded.restaurantId);
      if (!resExists) {
        return res.status(401).json({ success: false, message: 'Invalid token. Restaurant not found.' });
      }
      req.user = {
        _id: decoded.restaurantId,
        restaurantId: decoded.restaurantId,
        role: 'restaurant'
      };
      return next();
    }

    if (decoded.role === 'delivery') {
      req.user = {
        _id: decoded.deliveryPartnerId,
        deliveryPartnerId: decoded.deliveryPartnerId,
        role: 'delivery'
      };
      return next();
    }

    if (decoded.role === 'admin') {
      req.user = {
        _id: decoded.adminId,
        adminId: decoded.adminId,
        role: 'admin'
      };
      return next();
    }

    const user = await User.findById(decoded.userId).select('-__v');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found or deactivated.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please refresh your token.',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

export { authMiddleware as authenticate };
export default authMiddleware;

