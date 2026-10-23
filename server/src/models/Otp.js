/**
 * OTP Model
 * 
 * Temporary storage for OTP codes during phone verification.
 * Documents auto-expire after 5 minutes via MongoDB TTL index.
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const OtpSchema = new Schema({
  phone: {
    type: String,
    required: true,
    index: true
  },
  code: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Max 5 wrong attempts before OTP is invalidated
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // TTL index — MongoDB auto-deletes expired docs
  }
}, {
  timestamps: true
});

const Otp = mongoose.model('Otp', OtpSchema);

export default Otp;

