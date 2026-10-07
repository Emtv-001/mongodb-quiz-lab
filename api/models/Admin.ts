import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  displayName: { type: String, required: true },
  passwordHash: { type: String, required: true },
  recoveryPhrase: { type: String, required: true },
  role: { type: String, required: true },
  permissions: { type: mongoose.Schema.Types.Mixed, required: true },
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, default: 'system' }
});

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
