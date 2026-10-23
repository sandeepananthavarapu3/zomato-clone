import User from '../models/User.js';

/**
 * Get user profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-__v');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile fetched successfully',
      data: user
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true, runValidators: true }
    ).select('-__v');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
};

/**
 * Add a new address
 */
export const addAddress = async (req, res) => {
  try {
    // Basic implementation - User schema might need an addresses array or a separate model
    // Assuming User model has addresses: [{ street, city, state, zipCode, location... }]
    // Since the system prompt didn't specify Address schema in User, I'll mock it if it's missing,
    // or you'd ideally have an Address model or addresses array in User.
    
    // For this example, let's assume we update an addresses array in User
    const addressData = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user.addresses) {
      user.addresses = []; // Dynamically add if not there
    }
    
    user.addresses.push(addressData);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: user.addresses[user.addresses.length - 1]
    });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ success: false, message: 'Server error adding address.' });
  }
};

/**
 * Update address
 */
export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const user = await User.findById(req.user._id);
    
    const address = user.addresses?.id(id);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }

    Object.assign(address, updateData);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: address
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ success: false, message: 'Server error updating address.' });
  }
};

/**
 * Delete address
 */
export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(req.user._id);
    user.addresses.pull(id);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ success: false, message: 'Server error deleting address.' });
  }
};

/**
 * Get favorite restaurants
 */
export const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites');
    
    res.status(200).json({
      success: true,
      message: 'Favorites fetched successfully',
      data: user.favorites || []
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ success: false, message: 'Server error fetching favorites.' });
  }
};

/**
 * Toggle favorite restaurant
 */
export const toggleFavorite = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const user = await User.findById(req.user._id);
    
    if (!user.favorites) {
      user.favorites = [];
    }

    const index = user.favorites.indexOf(restaurantId);
    if (index > -1) {
      user.favorites.splice(index, 1);
    } else {
      user.favorites.push(restaurantId);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: index > -1 ? 'Removed from favorites' : 'Added to favorites',
      data: user.favorites
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ success: false, message: 'Server error toggling favorite.' });
  }
};
