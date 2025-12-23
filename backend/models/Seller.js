import mongoose from 'mongoose';

const sellerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    smsNotificationEnabled: {
      type: Boolean,
      default: true,
    },
      licenseKey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LicenseKey',
      required: true,
      unique: true,
    },
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Seller', sellerSchema);
