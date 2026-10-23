import mongoose from 'mongoose';

const deliveryPartnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  isOnline: { type: Boolean, default: false },
  currentStatus: { 
    type: String, 
    enum: ['AVAILABLE', 'BUSY', 'OFFLINE'], 
    default: 'OFFLINE' 
  },
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  vehicle: {
    type: { type: String, enum: ['BIKE', 'SCOOTER', 'BICYCLE'], default: 'BIKE' },
    registrationNumber: { type: String }
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  }
}, { timestamps: true });

deliveryPartnerSchema.index({ currentLocation: '2dsphere' });
deliveryPartnerSchema.index({ phone: 1 });

export default mongoose.model('DeliveryPartner', deliveryPartnerSchema);
