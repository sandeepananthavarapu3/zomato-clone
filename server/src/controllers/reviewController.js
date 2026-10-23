import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';

/**
 * Get restaurant reviews
 */
export const getRestaurantReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ restaurantId: id })
      .populate('userId', 'phone') // Assuming we want some user info
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Reviews fetched successfully',
      data: reviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: 'Server error fetching reviews.' });
  }
};

/**
 * Create a review
 */
export const createReview = async (req, res) => {
  try {
    const { restaurantId, orderId, rating, comment } = req.body;
    const userId = req.user._id;

    // Check if order exists and belongs to user
    const order = await Order.findOne({ _id: orderId, customerId: userId, restaurantId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Valid order not found for this review.' });
    }

    if (order.status !== 'DELIVERED') {
      return res.status(400).json({ success: false, message: 'Can only review delivered orders.' });
    }

    // Check if review already exists for this order
    const existingReview = await Review.findOne({ orderId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this order.' });
    }

    const review = new Review({
      userId,
      restaurantId,
      orderId,
      rating,
      comment
    });

    await review.save();

    // Update restaurant rating
    const reviews = await Review.find({ restaurantId });
    const avgRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
    
    await Restaurant.findByIdAndUpdate(restaurantId, {
      'rating.average': avgRating.toFixed(1),
      'rating.count': reviews.length
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ success: false, message: 'Server error creating review.' });
  }
};

/**
 * Get user's reviews
 */
export const getMyReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ userId })
      .populate('restaurantId', 'name coverImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'User reviews fetched successfully',
      data: reviews
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user reviews.' });
  }
};
