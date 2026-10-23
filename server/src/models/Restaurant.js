import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  cuisineTypes: [{ type: String }],
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  costForTwo: { type: Number, required: true }, // in paise
  estimatedDeliveryTimeMinutes: { type: Number, required: true },
  coverImage: { type: String },
  images: [{ type: String }],
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  address: {
    street: { type: String },
    city: { type: String },
    postalCode: { type: String },
    landmark: { type: String }
  },
  isOpen: { type: Boolean, default: true },
  isAcceptingOrders: { type: Boolean, default: true },
  isWelcomeOfferEnabled: { type: Boolean, default: true },

  customCoupons: [{
    code: { type: String, uppercase: true },
    discountPercentage: { type: Number, min: 1, max: 100 },
    maxDiscount: { type: Number }, // in paise
    minOrderValue: { type: Number, default: 0 }, // in paise
    isActive: { type: Boolean, default: true }
  }],

  operatingHours: [{
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    open: { type: String }, // e.g., '10:00'
    close: { type: String } // e.g., '23:00'
  }],
  contactPhone: { type: String },
  ownerPhone: { type: String, sparse: true }, // Used for Restaurant Partner App login
  isVeg: { type: Boolean, default: false },
  tags: [{ type: String }]
}, { timestamps: true });

restaurantSchema.index({ location: '2dsphere' });

export default mongoose.model('Restaurant', restaurantSchema);
