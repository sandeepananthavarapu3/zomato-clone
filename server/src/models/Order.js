import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  unitPrice: { type: Number, required: true }, // in paise
  quantity: { type: Number, required: true, min: 1 },
  selectedCustomizations: [{
    groupTitle: { type: String },
    optionName: { type: String },
    price: { type: Number } // in paise
  }],
  itemTotal: { type: Number, required: true } // in paise
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  restaurantName: { type: String, required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId }, // Can be populated later
  items: [orderItemSchema],
  deliveryAddress: {
    formattedAddress: { type: String, required: true },
    landmark: { type: String },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] } // [longitude, latitude]
    }
  },
  pricing: {
    subtotal: { type: Number, required: true }, // in paise
    deliveryFee: { type: Number, required: true }, // in paise
    taxes: { type: Number, required: true }, // in paise
    platformFee: { type: Number, required: true }, // in paise
    driverTip: { type: Number, default: 0 }, // in paise
    discount: { type: Number, default: 0 }, // in paise
    zomatoAbsorbedDiscount: { type: Number, default: 0 }, // in paise
    restaurantAbsorbedDiscount: { type: Number, default: 0 }, // in paise
    zomatoCommission: { type: Number, default: 0 }, // in paise
    total: { type: Number, required: true },
    previousCancellationPenalty: { type: Number, default: 0 },
    restaurantPayout: { type: Number, default: 0 },
    deliveryPayout: { type: Number, default: 0 },
    zomatoRevenue: { type: Number, default: 0 }
  },
  payment: {
    transactionId: { type: String },
    method: { type: String, enum: ['CARD', 'UPI', 'CASH'], required: true },
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'], default: 'PENDING' }
  },
  status: {
    type: String,
    enum: ['PLACED', 'RESTAURANT_ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
    default: 'PLACED'
  },
  timeline: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now },
    note: { type: String }
  }],
  estimatedDeliveryTime: { type: Date },
  cancellationReason: { type: String }
}, { timestamps: true });

orderSchema.index({ customerId: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
