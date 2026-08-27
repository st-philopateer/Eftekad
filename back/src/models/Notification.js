import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    type: { type: String, default: 'general' },
    message: { type: String, required: true },
    targetUser: { type: String, default: 'all', index: true },
    sourceUser: { type: String, default: 'system' },
    read: { type: Boolean, default: false },
    timestamp: { type: String, default: () => new Date().toISOString() },
    serviceYear: { type: String, default: '2026', index: true },
  },
  {
    timestamps: true,
    strict: false,
    collection: 'notifications',
  }
);

notificationSchema.index({ targetUser: 1, read: 1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export default Notification;
