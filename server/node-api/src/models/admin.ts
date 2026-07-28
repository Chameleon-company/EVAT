import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    default: 'admin',
  },
  password: {
    type: String,
    default: 'admin',
  },
  twoFactorCode: {
    type: String,
    default: null,
  },
  twoFactorCodeExpiry: {
    type: Date,
    default: null,
  },
  email: {
    type: String,
    default: 'admin@example.com',
    lowercase: true,
    trim: true,
  },
});

export default mongoose.model('Admin', adminSchema);
