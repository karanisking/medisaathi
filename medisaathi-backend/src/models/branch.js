import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    url:    { type: String, required: true },
    fileId: { type: String, required: true },
    name:   { type: String, default: '' },
  },
  { _id: false }
);

const branchSchema = new mongoose.Schema(
  {
    hospital: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Hospital',
      required: true,
    },
    name: {
      type:     String,
      required: [true, 'Branch name is required'],
      trim:     true,
    },
    city: {
      type:      String,
      required:  [true, 'City is required'],
      trim:      true,
      lowercase: true,
    },
    state: {
      type:      String,
      required:  [true, 'State is required'],
      trim:      true,
      lowercase: true,
    },
    address: {
      type:    String,
      trim:    true,
      default: '',
    },
    contactPhone: {
      type:    String,
      trim:    true,
      default: '',
    },
    contactEmail: {
      type:      String,
      trim:      true,
      lowercase: true,
      default:   '',
    },
    openTime:  { type: String, default: '09:00' },
    closeTime: { type: String, default: '17:00' },
    images: {
      type:    [imageSchema],
      default: [],
    },
    queueEnabled: {
      type:    Boolean,
      default: false,
    },
    problemCategories: {
      type:    [String],
      default: ['eye', 'ent', 'general', 'ortho', 'dental', 'other'],
    },
    // Skip timeout in seconds — configurable per branch
    skipTimeoutSec: {
      type:    Number,
      default: 25,
      min:     10,
      max:     120,
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
    createdBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
  },
  { timestamps: true }
);

branchSchema.index({ hospital: 1 });
branchSchema.index({ city: 1, state: 1 });
branchSchema.index({ hospital: 1, isActive: 1 });
branchSchema.index({ queueEnabled: 1 });

export const Branch = mongoose.model('Branch', branchSchema);