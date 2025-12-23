import mongoose from 'mongoose';

const licenseKeySchema = new mongoose.Schema({
  keyHash: {
    type: String,
    required: true,
    unique: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  assignedToSeller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
  },
  expiresAt: {
    type: Date,
    
  },
}, { timestamps: true });

licenseKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('LicenseKey', licenseKeySchema);
