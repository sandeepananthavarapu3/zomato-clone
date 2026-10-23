import express from 'express';
import { getRestaurantReviews, createReview, getMyReviews } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/restaurant/:id', getRestaurantReviews);

// Protected routes
router.use(authenticate);
router.post('/', createReview);
router.get('/my-reviews', getMyReviews);

export default router;
