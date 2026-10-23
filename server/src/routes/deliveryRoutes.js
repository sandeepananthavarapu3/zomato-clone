import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import Order from '../models/Order.js';
import DeliveryPartner from '../models/DeliveryPartner.js';

const router = Router();

// Ensure only delivery partners can access these routes
const restrictToDelivery = (req, res, next) => {
  if (req.user?.role !== 'delivery') {
    return res.status(403).json({ success: false, message: 'Forbidden. Delivery Partner access only.' });
  }
  next();
};

router.use(authMiddleware, restrictToDelivery);

// Get available orders (READY_FOR_PICKUP and unassigned)
router.get('/orders/available', async (req, res) => {
  try {
    const orders = await Order.find({ 
      status: 'READY_FOR_PICKUP',
      driverId: { $exists: false }
    }).populate('restaurantId', 'name location address').sort({ createdAt: -1 }).limit(10);
    
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching available orders' });
  }
});

// Get currently active order for this rider
router.get('/orders/active', async (req, res) => {
  try {
    const orders = await Order.find({ 
      driverId: req.user.deliveryPartnerId,
      status: { $in: ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'] }
    }).populate('restaurantId', 'name location address').sort({ createdAt: -1 });
    
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching active orders' });
  }
});

// Get delivery history for this rider
router.get('/orders/history', async (req, res) => {
  try {
    const orders = await Order.find({ 
      driverId: req.user.deliveryPartnerId,
      status: 'DELIVERED'
    }).populate('restaurantId', 'name location address').sort({ createdAt: -1 }).limit(20);
    
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching order history' });
  }
});

// Accept an order (Assigns driver, keeps status READY_FOR_PICKUP)
router.patch('/orders/:id/accept', async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, status: 'READY_FOR_PICKUP', driverId: { $exists: false } },
      { 
        $set: { driverId: req.user.deliveryPartnerId } 
      },
      { new: true }
    );

    if (!order) {
      return res.status(400).json({ success: false, message: 'Order is no longer available for pickup' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error accepting order' });
  }
});

// Update order status (To OUT_FOR_DELIVERY or DELIVERED)
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, driverId: req.user.deliveryPartnerId },
      { 
        $set: { status },
        $push: { timeline: { status, note: `Status updated to ${status} by rider` } }
      },
      { new: true }
    );

    if (!order) {
      return res.status(400).json({ success: false, message: 'Order not found or unauthorized' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating order status' });
  }
});

// Update online/offline status
router.patch('/status', async (req, res) => {
  try {
    const { isOnline } = req.body;
    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.user.deliveryPartnerId,
      { $set: { isOnline, currentStatus: isOnline ? 'AVAILABLE' : 'OFFLINE' } },
      { new: true }
    );
    res.json({ success: true, data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating status' });
  }
});

export default router;

// Get Delivery Revenue
router.get('/revenue', async (req, res) => {
  try {
    const orders = await Order.find({ 
      driverId: req.user.deliveryPartnerId,
      status: 'DELIVERED'
    });
    const totalRevenue = orders.reduce((sum, order) => sum + (order.pricing?.deliveryPayout || 0), 0);
    res.json({ success: true, data: { totalRevenue, orderCount: orders.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error calculating revenue' });
  }
});
