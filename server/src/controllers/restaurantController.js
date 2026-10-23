import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';

/**
 * Get nearby restaurants with pagination and filters
 */
export const getNearbyRestaurants = async (req, res) => {
  try {
    const { lat, lng, radius = 5, page = 1, limit = 10, cuisine, isVeg, sort = 'rating' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required.' });
    }

    const query = {
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000 // meters
        }
      },
      isOpen: true
    };

    if (cuisine) query.cuisineTypes = { $in: [cuisine] };
    if (isVeg === 'true') query.isVeg = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let restaurantsQuery = Restaurant.find(query).skip(skip).limit(parseInt(limit));

    // Sort by rating, cost, or new
    if (sort === 'rating') {
      restaurantsQuery = restaurantsQuery.sort({ 'rating.average': -1 });
    } else if (sort === 'new') {
      restaurantsQuery = restaurantsQuery.sort({ createdAt: -1 });
    } else if (sort === 'cost_low') {
      restaurantsQuery = restaurantsQuery.sort({ costForTwo: 1 });
    } else if (sort === 'cost_high') {
      restaurantsQuery = restaurantsQuery.sort({ costForTwo: -1 });
    }

    const restaurants = await restaurantsQuery.exec();
    
    // We can't do exact count easily with $near in aggregation sometimes without extra work, 
    // so we'll just return the results.
    res.status(200).json({
      success: true,
      message: 'Nearby restaurants fetched successfully',
      data: restaurants
    });
  } catch (error) {
    console.error('Error fetching nearby restaurants:', error);
    res.status(500).json({ success: false, message: 'Server error fetching restaurants.' });
  }
};

/**
 * Get a single restaurant by slug
 */
export const getRestaurantBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const restaurant = await Restaurant.findOne({ slug });

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Restaurant fetched successfully',
      data: restaurant
    });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ success: false, message: 'Server error fetching restaurant.' });
  }
};

/**
 * Get restaurant menu grouped by category
 */
export const getRestaurantMenu = async (req, res) => {
  try {
    const { slug } = req.params;
    const restaurant = await Restaurant.findOne({ slug });

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }

    const menuItems = await MenuItem.find({ restaurantId: restaurant._id });

    // Group by category
    const groupedMenu = menuItems.reduce((acc, item) => {
      const category = item.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      message: 'Menu fetched successfully',
      data: groupedMenu
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ success: false, message: 'Server error fetching menu.' });
  }
};

/**
 * Search for restaurants and dishes
 */
export const searchRestaurantsAndDishes = async (req, res) => {
  try {
    const { q, lat, lng } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query is required.' });
    }

    const searchRegex = new RegExp(q, 'i');
    
    // Simple search (can be enhanced with text index or Atlas Search)
    const restaurants = await Restaurant.find({
      name: searchRegex,
      isOpen: true
    }).limit(5);

    const dishes = await MenuItem.find({
      name: searchRegex,
      isAvailable: true
    }).populate('restaurantId', 'name slug coverImage').limit(10);

    res.status(200).json({
      success: true,
      message: 'Search completed',
      data: {
        restaurants,
        dishes
      }
    });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ success: false, message: 'Server error during search.' });
  }
};
