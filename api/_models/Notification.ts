import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  audience: { type: String, enum: ['all', 'learners', 'admins'], default: 'all' },
  type: { type: String, enum: ['info', 'warning', 'success', 'urgent'], default: 'info' },
  sendEmail: { type: Boolean, default: false },
  showPopup: { type: Boolean, default: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
});

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
