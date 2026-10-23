import mongoose from 'mongoose';

const customizationOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0 }, // in paise
  isDefault: { type: Boolean, default: false }
}, { _id: false });

const customizationGroupSchema = new mongoose.Schema({
  title: { type: String, required: true },
  minSelections: { type: Number, default: 0 },
  maxSelections: { type: Number, default: 1 },
  options: [customizationOptionSchema]
}, { _id: false });

const menuItemSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true }, // in paise
  category: { type: String, required: true },
  isVeg: { type: Boolean, required: true },
  isAvailable: { type: Boolean, default: true },
  isBestseller: { type: Boolean, default: false },
  imageUrl: { type: String },
  customizationGroups: [customizationGroupSchema]
}, { timestamps: true });

export default mongoose.model('MenuItem', menuItemSchema);
