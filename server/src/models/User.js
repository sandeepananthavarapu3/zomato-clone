/**
 * User Model
 * 
 * Stores user profile data including phone number, name, addresses, etc.
 * When account is deleted, this ENTIRE document is removed.
 * The PhoneHashLedger retains only the hash for anti-abuse detection.
 * 
 * The `isReturningUser` flag is set during registration if the phone hash
 * already exists in the ledger — meaning this user previously had an account.
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const AddressSchema = new Schema({
  label: {
    type: String,
    enum: ['Home', 'Work', 'Other'],
    default: 'Other'
  },
  formattedAddress: { type: String, required: true },
  landmark: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] } // [longitude, latitude]
  },
  isDefault: { type: Boolean, default: false }
});

const UserSchema = new Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  name: {
    type: String,
    trim: true,
    default: ''
  },

  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true, // allows multiple null values in unique index
    default: null
  },

  avatar: {
    type: String,
    default: null
  },

  addresses: [AddressSchema],

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚨 ANTI-ABUSE FLAGS — Set during registration
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // TRUE if this phone number was previously registered and deleted
  // When true, new-user benefits are BLOCKED
  isReturningUser: {
    type: Boolean,
    default: false,
    index: true
  },

  // How many times this phone number has been registered
  // 1 = first time, 2+ = returning user
  registrationCount: {
    type: Number,
    default: 1
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BENEFITS & PROMOTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Whether the user is eligible for new-user benefits
  // Automatically set to FALSE if isReturningUser is TRUE
  isEligibleForNewUserBenefits: {
    type: Boolean,
    default: true
  },

  // Track which benefits have been claimed
  claimedBenefits: [{
    benefitType: {
      type: String,
      enum: [
        'FREE_DELIVERY_FIRST_ORDER',
        'SIGNUP_DISCOUNT',
        'WELCOME_COUPON',
        'REFERRAL_BONUS',
        'FIRST_ORDER_CASHBACK'
      ]
    },
    claimedAt: { type: Date, default: Date.now },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' }
  }],

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FAVORITES & PREFERENCES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  favoriteRestaurants: [{
    type: Schema.Types.ObjectId,
    ref: 'Restaurant'
  }],

  // User preferences
  preferences: {
    isVegOnly: { type: Boolean, default: false },
    preferredCuisines: [{ type: String }]
  },

  outstandingPenalty: { type: Number, default: 0 },
  role: {
    type: String,
    enum: ['customer', 'restaurant_owner', 'delivery_partner', 'admin'],
    default: 'customer'
  },

  isActive: {
    type: Boolean,
    default: true
  },

  lastLoginAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for geospatial queries on user addresses
AddressSchema.index({ location: '2dsphere' });

const User = mongoose.model('User', UserSchema);

export default User;

