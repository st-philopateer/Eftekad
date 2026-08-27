import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, index: true },
    password: { type: String, required: true },
    role: { type: String, default: 'servant', index: true },
    church: { type: String, default: '' },
    email: { type: String, default: '', trim: true },
    profilePic: { type: String, default: '' },
    status: { type: String, default: 'active' },
    osra: { type: String, default: '' },
    phone: { type: String, default: '' },
    assignedStage: { type: String, default: '' },
    assignedClass: { type: String, default: '' },
    rolesList: { type: Array, default: [] },
    permissions: { type: Object, default: {} },
  },
  {
    timestamps: true,
    strict: false,
    collection: 'users',
  }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
