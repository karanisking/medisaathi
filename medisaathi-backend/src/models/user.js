import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = {
  SUPER_ADMIN:   'super_admin',
  OVERALL_ADMIN: 'overall_admin',
  BRANCH_ADMIN:  'branch_admin',
  STAFF:         'staff',
  PATIENT:       'patient',
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,      // this already creates an index — no need for schema.index({ email: 1 }) below
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select:    false,
    },
    role: {
      type:     String,
      enum:     Object.values(ROLES),
      required: true,
    },

    // null for super_admin and patient
    hospital: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Hospital',
      default: null,
    },

    // null for super_admin, overall_admin, and patient
    branch: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Branch',
      default: null,
    },

    isActive: {
      type:    Boolean,
      default: true,
    },

    // null for self-registered patients + seeded super admin
    createdBy: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
  },
  { timestamps: true }
);

// ── Hooks ─────────────────────────────────────────────────────────────────────

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance methods ──────────────────────────────────────────────────────────

userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

// ── Indexes ───────────────────────────────────────────────────────────────────

// email index is already created by unique:true above — do NOT add schema.index({ email: 1 })
userSchema.index({ role: 1 });
userSchema.index({ hospital: 1, role: 1 });
userSchema.index({ branch: 1, role: 1 });

export const User = mongoose.model('User', userSchema);