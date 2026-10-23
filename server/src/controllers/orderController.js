import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Place a new order
 */
export const placeOrder = async (req, res) => {
  try {
    // Basic implementation (idempotency key check can be added using a Redis cache or separate model)
    const { idempotencyKey, restaurantId, items, deliveryAddress, payment, couponCode } = req.body;
    const customerId = req.user._id;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order items are required.' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }
    
    if (!restaurant.isAcceptingOrders) {
      return res.status(400).json({ success: false, message: 'Restaurant is currently not accepting orders.' });
    }

    let subtotal = 0;
    const validatedItems = [];

    // Validate items and calculate subtotal
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.itemId);
      if (!menuItem) {
        return res.status(400).json({ success: false, message: `Item ${item.itemId} not found.` });
      }

      let itemTotal = menuItem.price * item.quantity;

      // Add customization prices
      if (item.selectedCustomizations) {
        for (const cust of item.selectedCustomizations) {
          itemTotal += (cust.price || 0) * item.quantity;
        }
      }

      subtotal += itemTotal;
      
      validatedItems.push({
        itemId: menuItem._id,
        name: menuItem.name,
        unitPrice: menuItem.price,
        quantity: item.quantity,
        selectedCustomizations: item.selectedCustomizations,
        itemTotal
      });
    }

    let discount = 0;
    let zomatoAbsorbedDiscount = 0;
    let restaurantAbsorbedDiscount = 0;
    
    // --- COUPON LOGIC ---
    if (couponCode) {
      if (couponCode === 'WELCOME50') {
        // Check if restaurant opted in
        if (!restaurant.isWelcomeOfferEnabled) {
          return res.status(400).json({ success: false, message: 'This restaurant does not participate in the WELCOME50 offer.' });
        }

        // Check if eligible
        if (!req.user.isEligibleForNewUserBenefits) {
          return res.status(400).json({ success: false, message: 'You are not eligible for new user benefits.' });
        }
        
        if (subtotal < 9900) {
          return res.status(400).json({ success: false, message: 'WELCOME50 requires a minimum order of ₹99.' });
        }
        
        // Check if already claimed
        const hasClaimed = req.user.claimedBenefits.some(b => b.benefitType === 'WELCOME_COUPON');
        if (hasClaimed) {
          return res.status(400).json({ success: false, message: 'You have already used the WELCOME50 coupon.' });
        }

        // Calculate 50% off up to ₹100
        let calculatedDiscount = Math.round(subtotal * 0.50);
        if (calculatedDiscount > 10000) calculatedDiscount = 10000; // max ₹100 off
        discount = calculatedDiscount;
        zomatoAbsorbedDiscount = discount; // Zomato pays for WELCOME promos
      } else {
        // Check if it's a custom restaurant coupon
        const customCoupon = restaurant.customCoupons?.find(c => c.code === couponCode.toUpperCase());
        if (!customCoupon || !customCoupon.isActive) {
          return res.status(400).json({ success: false, message: 'Invalid or expired coupon code.' });
        }
        
        if (customCoupon.minOrderValue && subtotal < customCoupon.minOrderValue) {
          return res.status(400).json({ success: false, message: `This coupon requires a minimum order of ₹${customCoupon.minOrderValue / 100}.` });
        }
        
        // Apply custom discount
        let calculatedDiscount = Math.round(subtotal * (customCoupon.discountPercentage / 100));
        if (customCoupon.maxDiscount && calculatedDiscount > customCoupon.maxDiscount) {
          calculatedDiscount = customCoupon.maxDiscount;
        }
        discount = calculatedDiscount;
        restaurantAbsorbedDiscount = discount; // Restaurant pays for their own custom promos
      }
    }

    const deliveryFee = 4000; // ₹40
    // Tax is charged on post-discount subtotal if the restaurant absorbed it
    const taxableAmount = subtotal - restaurantAbsorbedDiscount;
    const taxes = Math.round(taxableAmount * 0.05); // 5% tax
    const platformFee = 200; // ₹2
    
    // Check if user has outstanding penalties
    
    const userDoc = await User.findById(customerId);
    const previousCancellationPenalty = userDoc.outstandingPenalty || 0;

    const total = subtotal + deliveryFee + taxes + platformFee - discount + previousCancellationPenalty;

    // --- Financial Breakdowns ---
    // 10% commission to Zomato based on restaurant's actual subtotal take
    const commissionableAmount = subtotal - restaurantAbsorbedDiscount;
    const zomatoCommission = Math.round(commissionableAmount * 0.10);
    
    // Restaurant gets their subtotal minus the discount they gave and the Zomato commission
    const restaurantPayout = subtotal - restaurantAbsorbedDiscount - zomatoCommission;
    
    // Random rider payout between ₹20 and ₹150 (in paise)
    const randomRiderRupees = Math.floor(Math.random() * (150 - 20 + 1)) + 20;
    const deliveryPayout = randomRiderRupees * 100;
    
    // Zomato keeps platform fee, commission, taxes, and delivery fee delta, MINUS any discount they absorbed, PLUS any penalty collected
    const zomatoRevenue = zomatoCommission + platformFee + (deliveryFee - deliveryPayout) - zomatoAbsorbedDiscount + previousCancellationPenalty;

    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const order = new Order({
      orderNumber,
      customerId,
      restaurantId,
      restaurantName: restaurant.name,
      items: validatedItems,
      deliveryAddress,
      pricing: {
        subtotal,
        deliveryFee,
        taxes,
        platformFee,
        discount,
        zomatoAbsorbedDiscount,
        restaurantAbsorbedDiscount,
        zomatoCommission,
        previousCancellationPenalty,
        total,
        restaurantPayout,
        deliveryPayout,
        zomatoRevenue
      },
      payment: {
        ...payment,
        status: payment.method === 'CASH' ? 'PENDING' : 'COMPLETED' // Simplified
      },
      status: 'PLACED',
      timeline: [{ status: 'PLACED', note: 'Order placed successfully' }],
      estimatedDeliveryTime: new Date(Date.now() + restaurant.estimatedDeliveryTimeMinutes * 60000)
    });

    await order.save();
    
    // Mark the benefit as claimed for the user
    if (couponCode === 'WELCOME50') {
      req.user.claimedBenefits.push({
        benefitType: 'WELCOME_COUPON',
        orderId: order._id
      });
      await req.user.save();
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ success: false, message: 'Server error placing order.' });
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customerId: req.user._id }).populate('driverId', 'name phone vehicle');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Order fetched successfully',
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, message: 'Server error fetching order.' });
  }
};

/**
 * Get user's orders (paginated)
 */
export const getMyOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ customerId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Orders fetched successfully',
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Server error fetching orders.' });
  }
};

/**
 * Update order status (Typically for restaurant/driver apps, but included here)
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    order.status = status;
    order.timeline.push({ status, note });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Server error updating order status.' });
  }
};

/**
 * Cancel an order
 */
export const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({ _id: req.params.id, customerId: req.user._id }).populate('driverId', 'name phone vehicle');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order is already delivered or cancelled.' });
    }

    // Time based cancellation logic
    const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
    const elapsedMins = elapsedMs / 60000;
    
    let penaltyPercent = 0;
    if (elapsedMins <= 1) {
      penaltyPercent = 0; // 0% charge
    } else if (elapsedMins > 1 && elapsedMins <= 20) {
      penaltyPercent = 0.50; // 50% charge
    } else {
      penaltyPercent = 1.0; // 100% charge
    }

    const totalPaid = order.pricing.total || 0;
    const penaltyAmount = Math.round(totalPaid * penaltyPercent);
    const refundAmount = totalPaid - penaltyAmount;

    // Apply financial changes
    order.pricing.restaurantPayout = 0;
    order.pricing.zomatoRevenue = 0;
    order.pricing.deliveryPayout = 0;
    
    if (penaltyAmount > 0) {
      // The user owes this penalty on their next order
      
      await User.findByIdAndUpdate(req.user._id, { $inc: { outstandingPenalty: penaltyAmount } });
    }

    order.status = 'CANCELLED';
    order.cancellationReason = reason || `Cancelled by user. Penalty transferred to next order: ₹${penaltyAmount / 100}`;
    order.timeline.push({ 
      status: 'CANCELLED', 
      note: `Order cancelled. Refund: ₹${refundAmount / 100}. Penalty to pay on next order: ₹${penaltyAmount / 100}` 
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        ...order.toObject(),
        refundInfo: {
          penaltyAmount,
          refundAmount,
          penaltyPercent
        }
      }
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ success: false, message: 'Server error cancelling order.' });
  }
};
