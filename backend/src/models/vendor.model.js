import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['INGREDIENTS', 'UTILITIES', 'HOUSEKEEPING', 'SERVICES', 'OTHER'],
      required: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

vendorSchema.index({ restaurantId: 1, name: 1 }, { unique: true });

const Vendor = mongoose.model('Vendor', vendorSchema);
export default Vendor;
