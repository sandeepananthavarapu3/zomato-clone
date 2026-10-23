/**
 * Auth Routes
 * 
 * Public routes:
 *   POST /api/v1/auth/send-otp      — Send OTP to phone
 *   POST /api/v1/auth/verify-otp    — Verify OTP → Login or Register (with anti-abuse check)
 *   POST /api/v1/auth/refresh       — Refresh access token
 * 
 * Protected routes (require JWT):
 *   DELETE /api/v1/auth/account      — Delete account (preserves phone hash)
 *   GET    /api/v1/auth/benefits     — Check benefit eligibility
 */

import { Router } from 'express';
import {
  getMe,
  sendOtp,
  verifyOtp,
  verifyRestaurantOtp,
  verifyDeliveryOtp,
  refreshToken,
  deleteAccount,
  getBenefitsStatus
} from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// ── Public Routes ──
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/restaurant/verify-otp', verifyRestaurantOtp); // Restaurant partner login
router.post('/delivery/verify-otp', verifyDeliveryOtp); // Delivery partner login
router.post('/refresh', refreshToken);

// ── Protected Routes (require authentication) ──
router.delete('/account', authMiddleware, deleteAccount);
router.get('/benefits', authMiddleware, getBenefitsStatus);

router.get('/me', authMiddleware, getMe);

export default router;

