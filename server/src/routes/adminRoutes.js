import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// Admin Login (Hardcoded bypass for id: 1111)
router.post('/login', (req, res) => {
  const { id } = req.body;
  if (id === '1111') {
    const accessToken = jwt.sign(
      { adminId: '1111', role: 'admin' },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({ success: true, data: { tokens: { accessToken } } });
  }
  return res.status(401).json({ success: false, message: 'Invalid Admin Credentials' });
});

// Require Admin Role Middleware
const restrictToAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden. Admin access only.' });
  }
  next();
};

// Get Global Platform Revenue
router.get('/revenue', authMiddleware, restrictToAdmin, async (req, res) => {
  try {
    const orders = await Order.find({ status: { $in: ['DELIVERED', 'CANCELLED'] } }).populate('restaurantId', 'name');
    
    let totalPlatformRevenue = 0;
    const restaurantBreakdown = {};
    let completedCount = 0;

    orders.forEach(order => {
      const rev = order.pricing?.zomatoRevenue || 0;
      totalPlatformRevenue += rev;
      
      const restId = order.restaurantId?._id?.toString();
      const restName = order.restaurantId?.name || 'Unknown Restaurant';
      
      if (restId) {
        if (!restaurantBreakdown[restId]) {
          restaurantBreakdown[restId] = { name: restName, revenue: 0, orderCount: 0 };
        }
        restaurantBreakdown[restId].revenue += rev;
        if (order.status === 'DELIVERED') {
          restaurantBreakdown[restId].orderCount += 1;
          completedCount++;
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalPlatformRevenue,
        totalOrders: completedCount,
        breakdown: Object.values(restaurantBreakdown).sort((a, b) => b.revenue - a.revenue),
        orders: orders
      }
    });
  } catch (error) {
    console.error('Error fetching admin revenue:', error);
    res.status(500).json({ success: false, message: 'Error calculating admin revenue' });
  }
});

// GET /fix-old-orders
router.get('/fix', async (req, res) => {
  const orders = await Order.find({ status: 'CANCELLED' });
  let fixed = 0;
  for (let o of orders) {
    if (o.pricing.zomatoRevenue === 2000 && o.pricing.restaurantPayout === -2000) {
       // Keep it
    } else {
       o.pricing.zomatoRevenue = 0;
       o.pricing.restaurantPayout = 0;
       await o.save();
       fixed++;
    }
  }
  res.json({ success: true, fixed });
});

export default router;
