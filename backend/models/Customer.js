import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
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
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    totalPurchaseAmount: {
      type: Number,
      default: 0,
    },
    totalPaidAmount: {
      type: Number,
      default: 0,
    },
    outstandingBalance: {
      type: Number,
      default: 0,
    },
    depositAmount: {
      type: Number,
      default: 0,
    },
      licenseKeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LicenseKey",
      unique: true,
      sparse: true,
    },
    totalInterest:{
      type:Number,
      default:0,
    
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index for seller's customers
customerSchema.index({ sellerId: 1, phone: 1 }, { unique: true });
customerSchema.index({ sellerId: 1, isActive: 1 });

export default mongoose.model('Customer', customerSchema);
