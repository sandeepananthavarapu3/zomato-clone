import express from 'express';
import { getProfile, updateProfile, addAddress, updateAddress, deleteAddress, getFavorites, toggleFavorite } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All user routes are protected
router.use(authenticate);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

router.post('/addresses', addAddress);
router.put('/addresses/:id', updateAddress);
router.delete('/addresses/:id', deleteAddress);

router.get('/favorites', getFavorites);
router.post('/favorites/:restaurantId', toggleFavorite);
router.delete('/favorites/:restaurantId', toggleFavorite);

export default router;
