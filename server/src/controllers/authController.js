/**
 * Authentication Controller
 * 
 * Handles the complete auth lifecycle:
 *   1. Send OTP to phone number
 *   2. Verify OTP → Register or Login
 *   3. Token refresh
 *   4. Account deletion (with hash preservation)
 * 
 * The CRITICAL anti-abuse logic lives in `verifyOtp`:
 *   - On registration, the phone number is hashed and checked against the PhoneHashLedger
 *   - If the hash exists (user previously deleted their account), the user is flagged
 *     as a "returning user" and new-user benefits are DENIED
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import DeliveryPartner from "../models/DeliveryPartner.js";
import Otp from '../models/Otp.js';
import PhoneHashLedger from '../models/PhoneHashLedger.js';
import { hashPhoneNumber } from '../utils/phoneHash.js';
import { getNewUserBenefits } from '../services/benefitsService.js';

/**
 * Generate a 6-digit OTP (mock implementation for dev)
 * In production, integrate with Twilio / MSG91 / AWS SNS
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate JWT access and refresh tokens
 */
function generateTokens(userId) {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );

  return { accessToken, refreshToken };
}

import twilio from 'twilio';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/v1/auth/send-otp
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Generate OTP
    const code = generateOTP();
    const expiresAt = new Date(
      Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES) || 5) * 60 * 1000
    );

    // Invalidate any existing OTPs for this phone
    await Otp.deleteMany({ phone });

    // Store new OTP
    await Otp.create({ phone, code, expiresAt });

    // Send Real SMS via Twilio
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          body: `Your Zomato Clone verification code is: ${code}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: `+91${phone}`
        });
        console.log(`✅ [SMS] Real SMS sent to +91${phone}`);
        
        return res.status(200).json({
          success: true,
          message: 'OTP sent successfully',
          otp: code // Send to frontend for testing bypass
        });
      } catch (twilioErr) {
        console.error(`❌ [TWILIO ERROR]: ${twilioErr.message}`);
        console.log(`📱 [FALLBACK] OTP for ${phone}: ${code}`);
        return res.status(200).json({
          success: true,
          message: 'OTP generated but SMS failed',
          warning: 'Twilio Trial Error: Unverified number.',
          otp: code // Send to frontend for testing bypass
        });
      }
    } else {
      console.log(`⚠️ [WARNING] Twilio keys missing in .env. Mock OTP for ${phone}: ${code}`);
      return res.status(200).json({
        success: true,
        message: 'OTP generated locally',
        otp: code // Send to frontend for testing bypass
      });
    }
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/v1/auth/verify-otp
// 
// 🔑 THIS IS WHERE THE ANTI-ABUSE MAGIC HAPPENS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const verifyOtp = async (req, res) => {
  try {
    const { phone, code, name } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP code are required'
      });
    }

    // 1️⃣ Verify the OTP
    const otpRecord = await Otp.findOne({
      phone,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Check max attempts
    if (otpRecord.attempts >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many attempts. Please request a new OTP.'
      });
    }

    // Verify code
    if (otpRecord.code !== code) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message: 'Incorrect OTP',
        attemptsRemaining: 5 - otpRecord.attempts
      });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // 2️⃣ Check if user already exists (login flow)
    let user = await User.findOne({ phone });
    let isNewRegistration = false;

    if (user) {
      // ── EXISTING USER LOGIN ──
      user.lastLoginAt = new Date();
      await user.save();

    } else {
      // ── NEW USER REGISTRATION ──
      isNewRegistration = true;

      // 3️⃣ 🚨 ANTI-ABUSE CHECK: Hash the phone number and check the ledger
      const phoneHash = hashPhoneNumber(phone);
      const { isReturningUser, registrationCount } =
        await PhoneHashLedger.recordRegistration(phoneHash);

      // 4️⃣ Create the user with appropriate flags
      user = await User.create({
        phone,
        name: name || 'User', // Save the provided name
        isReturningUser,
        registrationCount,
        isEligibleForNewUserBenefits: !isReturningUser, // 🚫 DENY if returning
        lastLoginAt: new Date()
      });

      if (isReturningUser) {
        console.log(
          `🚫 [ANTI-ABUSE] Returning user detected! ` +
          `Phone hash matched. Registration #${registrationCount}. ` +
          `New-user benefits DENIED.`
        );
      } else {
        console.log(`✅ [AUTH] Genuinely new user registered.`);
      }
    }

    // 5️⃣ Generate JWT tokens
    const tokens = generateTokens(user._id);

    // 6️⃣ Get applicable benefits
    const benefits = getNewUserBenefits(user.isReturningUser);

    res.status(200).json({
      success: true,
      message: isNewRegistration ? 'Registration successful' : 'Login successful',
      data: {
        user: {
          id: user._id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          isReturningUser: user.isReturningUser,
          isEligibleForNewUserBenefits: user.isEligibleForNewUserBenefits,
          registrationCount: user.registrationCount
        },
        tokens,
        benefits,
        isNewRegistration
      }
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/v1/auth/refresh
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user._id);

    res.status(200).json({
      success: true,
      data: { tokens }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DELETE /api/v1/auth/account
//
// 🔑 ACCOUNT DELETION — Deletes user data but PRESERVES the phone hash
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 1️⃣ Hash the phone number BEFORE deleting the user
    //    (we need the phone to compute the hash)
    const phoneHash = hashPhoneNumber(user.phone);

    // 2️⃣ Record the deletion in the PhoneHashLedger
    //    This sets hasBeenPreviouslyDeleted = true
    //    The hash will PERSIST forever — even after the user document is gone
    await PhoneHashLedger.recordDeletion(phoneHash);

    // 3️⃣ DELETE all user personal data
    //    Phone number, name, email, addresses — everything is GONE
    await User.findByIdAndDelete(userId);

    // 4️⃣ Optional: Delete related data (orders, reviews, etc.)
    //    In production, you might anonymize orders instead of deleting them
    // await Order.updateMany({ customerId: userId }, { customerId: null, customerName: 'Deleted User' });

    console.log(
      `🗑️ [ACCOUNT DELETION] User ${userId} deleted. ` +
      `Phone hash preserved in ledger for anti-abuse detection.`
    );

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully. All personal data has been removed.'
    });
  } catch (error) {
    console.error('Delete Account Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/v1/auth/benefits-status
// Check current user's benefit eligibility
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getBenefitsStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const benefits = getNewUserBenefits(user.isReturningUser);

    res.status(200).json({
      success: true,
      data: {
        isReturningUser: user.isReturningUser,
        registrationCount: user.registrationCount,
        isEligibleForNewUserBenefits: user.isEligibleForNewUserBenefits,
        ...benefits
      }
    });
  } catch (error) {
    console.error('Benefits Status Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get benefits status' });
  }
};


import Restaurant from '../models/Restaurant.js';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RESTAURANT AUTH: Generate JWTs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const generateRestaurantTokens = (restaurantId) => {
  const accessToken = jwt.sign(
    { restaurantId, role: 'restaurant' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );

  const refreshToken = jwt.sign(
    { restaurantId, role: 'restaurant' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );

  return { accessToken, refreshToken };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/v1/auth/restaurant/verify-otp
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const verifyRestaurantOtp = async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ success: false, message: 'Phone and code required' });
    }

    // Verify OTP
    const otpRecord = await Otp.findOne({
      phone,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    if (otpRecord.code !== code) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP' });
    }

    otpRecord.isUsed = true;
    await otpRecord.save();

    // Find the restaurant that owns this phone
    let restaurant = await Restaurant.findOne({ ownerPhone: phone });
    
    if (req.body.isSignup) {
      if (restaurant) {
        return res.status(400).json({ success: false, message: 'This phone number is already registered. Please use the login tab.' });
      }
      restaurant = await Restaurant.create({
        name: req.body.name || `New Restaurant ${phone.slice(-4)}`,
        slug: `restaurant-${phone}`,
        ownerPhone: phone,
        costForTwo: 50000,
        estimatedDeliveryTimeMinutes: 30,
        address: {
          street: '123 New Street',
          city: 'City',
          postalCode: '100000'
        },
        location: {
          type: 'Point',
          coordinates: [78.4867, 17.3850]
        },
        coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'],
        rating: 0,
        tags: ['New'],
        isWelcomeOfferEnabled: true,
        customCoupons: []
      });
    } else {
      if (!restaurant) {
        return res.status(403).json({ success: false, message: 'Phone number not registered. Please use the Join Zomato tab.' });
      }
    }

    const tokens = generateRestaurantTokens(restaurant._id);

    res.status(200).json({
      success: true,
      message: 'Restaurant login successful',
      data: {
        restaurant: {
          id: restaurant._id,
          name: restaurant.name,
          phone: restaurant.ownerPhone,
          customCoupons: restaurant.customCoupons,
          isWelcomeOfferEnabled: restaurant.isWelcomeOfferEnabled
        },
        tokens
      }
    });
  } catch (error) {
    console.error('Verify Restaurant OTP Error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

export const verifyDeliveryOtp = async (req, res) => {
  try {
    const { phone, code } = req.body;
    
    // In production: verify OTP against the database/Redis
    // For dev: hardcoded check or accept any 6-digit
    if (!code || code.length !== 6) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    let partner = await DeliveryPartner.findOne({ phone });
    
    if (req.body.isSignup) {
      if (partner) {
        return res.status(400).json({ success: false, message: 'This phone number is already registered. Please login.' });
      }
      partner = await DeliveryPartner.create({
        name: req.body.name || `Rider ${phone.slice(-4)}`,
        phone: phone,
        currentStatus: 'OFFLINE',
        isOnline: false,
        currentLocation: {
          type: 'Point',
          coordinates: [78.4867, 17.3850]
        },
        vehicle: {
          type: 'BIKE',
          registrationNumber: 'NEW-RIDER'
        }
      });
    } else {
      if (!partner) {
        return res.status(403).json({ success: false, message: 'Phone number not registered. Please sign up first.' });
      }
    }

    const accessToken = jwt.sign(
      { deliveryPartnerId: partner._id, role: 'delivery' },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        partner,
        tokens: { accessToken }
      }
    });
  } catch (error) {
    console.error('Verify Delivery OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error during OTP verification' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
