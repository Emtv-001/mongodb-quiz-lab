import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  _id: { type: String, required: true },
  kind: { type: String, enum: ['visit', 'share'], required: true },
  channel: { type: String, required: true },
  referralCode: String,
  createdAt: { type: Date, required: true }
}, { versionKey: false });

schema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.models.SiteEvent || mongoose.model('SiteEvent', schema);
