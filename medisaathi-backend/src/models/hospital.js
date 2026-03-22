import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    url:    { type: String, required: true },
    fileId: { type: String, required: true },
    name:   { type: String, default: '' },
  },
  { _id: false }
);

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Hospital name is required'],
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
    description: {
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
    contactPhone: {
      type:    String,
      trim:    true,
      default: '',
    },
    website: {
      type:    String,
      trim:    true,
      default: '',
    },
    images: {
      type:    [imageSchema],
      default: [],
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

hospitalSchema.index({ name: 'text' });
hospitalSchema.index({ city: 1, state: 1 });
hospitalSchema.index({ isActive: 1 });

export const Hospital = mongoose.model('Hospital', hospitalSchema);