import express from 'express';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Middleware to ensure the user is a restaurant owner
const requireRestaurantRole = async (req, res, next) => {
  if (req.user.role !== 'restaurant') {
    return res.status(403).json({ success: false, message: 'Access denied. Restaurant partners only.' });
  }
  next();
};

// GET /api/v1/partner/orders - Get active orders for the logged-in restaurant
router.get('/orders', authMiddleware, requireRestaurantRole, async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const orders = await Order.find({ restaurantId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Fetch Partner Orders Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// PATCH /api/v1/partner/orders/:id/status - Update order status
router.patch('/orders/:id/status', authMiddleware, requireRestaurantRole, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const restaurantId = req.user.restaurantId;

    const validStatuses = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    let updatePayload = { status };
    if (status === 'CANCELLED') {
      updatePayload['pricing.restaurantPayout'] = -2000; // -₹20 penalty
      updatePayload['pricing.zomatoRevenue'] = 2000; // Zomato collects the penalty
    }

    const order = await Order.findOneAndUpdate(
      { _id: id, restaurantId },
      updatePayload,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Update Order Status Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
});

// PATCH /api/v1/partner/status - Toggle accepting orders
router.patch('/status', authMiddleware, requireRestaurantRole, async (req, res) => {
  try {
    const { isAcceptingOrders } = req.body;
    const restaurantId = req.user.restaurantId;

    const restaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      { isAcceptingOrders },
      { new: true }
    );

    res.status(200).json({ success: true, data: restaurant });
  } catch (error) {
    console.error('Update Restaurant Status Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

export default router;

// Get Restaurant Revenue
router.get('/revenue', authMiddleware, requireRestaurantRole, async (req, res) => {
  try {
    const orders = await Order.find({ 
      restaurantId: req.user.restaurantId,
      status: { $in: ['DELIVERED', 'CANCELLED'] }
    });
    const totalRevenue = orders.reduce((sum, order) => sum + (order.pricing?.restaurantPayout || 0), 0);
    const completedCount = orders.filter(o => o.status === 'DELIVERED').length;
    res.json({ success: true, data: { totalRevenue, orderCount: completedCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error calculating revenue' });
  }
});

// Toggle Welcome Offer
router.patch('/welcome-offer', authMiddleware, requireRestaurantRole, async (req, res) => {
  try {
    const { isWelcomeOfferEnabled } = req.body;
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.user.restaurantId,
      { $set: { isWelcomeOfferEnabled } },
      { new: true }
    );
    res.json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating offer status' });
  }
});

// Add/Update Custom Coupons
router.patch('/coupons', authMiddleware, requireRestaurantRole, async (req, res) => {
  try {
    const { customCoupons } = req.body;
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.user.restaurantId,
      { $set: { customCoupons } },
      { new: true }
    );
    res.json({ success: true, data: restaurant.customCoupons });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating coupons' });
  }
});

// ----------------------------------------------------
// MENU MANAGEMENT
// ----------------------------------------------------

// Get Menu Items
router.get('/menu', authMiddleware, requireRestaurantRole, async (req, res) => {
  try {
    const MenuItem = (await import('../models/MenuItem.js')).default;
    const menuItems = await MenuItem.find({ restaurantId: req.user.restaurantId });
    res.json({ success: true, data: menuItems });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching menu' });
  }
});

// Add Menu Item
router.post('/menu', authMiddleware, requireRestaurantRole, async (req, res) => {
  try {
    const MenuItem = (await import('../models/MenuItem.js')).default;
    const { name, description, price, category, isVeg, imageUrl } = req.body;
    
    // Auto-generate image if not provided
    const finalImageUrl = imageUrl || `https://loremflickr.com/400/300/${encodeURIComponent(name)},food/all`;
    
    const newItem = await MenuItem.create({
      restaurantId: req.user.restaurantId,
      name,
      description,
      price: price * 100, // assume incoming is Rs, convert to paise
      category,
      isVeg,
      imageUrl: finalImageUrl
    });
    
    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error creating menu item' });
  }
});

// Update Menu Item
router.patch('/menu/:id', authMiddleware, requireRestaurantRole, async (req, res) => {
  try {
    const MenuItem = (await import('../models/MenuItem.js')).default;
    const updates = { ...req.body };
    if (updates.price) updates.price = updates.price * 100; // convert to paise
    if (updates.name && !updates.imageUrl) {
       // if name changes and no new URL is provided, keep old URL or we could regen. Let's keep old.
    }
    
    const updatedItem = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId },
      { $set: updates },
      { new: true }
    );
    
    res.json({ success: true, data: updatedItem });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating menu item' });
  }
});

// Delete Menu Item
router.delete('/menu/:id', authMiddleware, requireRestaurantRole, async (req, res) => {
  try {
    const MenuItem = (await import('../models/MenuItem.js')).default;
    const deletedItem = await MenuItem.findOneAndDelete({ 
      _id: req.params.id, 
      restaurantId: req.user.restaurantId 
    });
    
    if (!deletedItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found or unauthorized' });
    }
    
    res.json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting menu item' });
  }
});
