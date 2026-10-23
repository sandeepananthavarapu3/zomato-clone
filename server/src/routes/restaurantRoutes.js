import express from 'express';
import Restaurant from '../models/Restaurant.js';
import { getNearbyRestaurants, getRestaurantBySlug, getRestaurantMenu, searchRestaurantsAndDishes } from '../controllers/restaurantController.js';

const router = express.Router();

router.get('/nearby', getNearbyRestaurants);
router.get('/search', searchRestaurantsAndDishes);
router.get('/:slug', getRestaurantBySlug);
router.get('/:slug/menu', getRestaurantMenu);

export default router;

// Get coupons for a restaurant by ID
router.get('/:id/coupons', async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    res.json({ success: true, data: restaurant.customCoupons || [], isWelcomeOfferEnabled: restaurant.isWelcomeOfferEnabled });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching coupons.' });
  }
});
