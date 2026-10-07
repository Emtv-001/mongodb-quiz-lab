import mongoose from 'mongoose';

const AdminInviteSchema = new mongoose.Schema({
  role: { type: String, required: true },
  permissions: { type: mongoose.Schema.Types.Mixed, required: true },
  invitationCode: { type: String, required: true, unique: true },
  recoveryPhrase: { type: String, required: true },
  status: { type: String, default: 'pending' },
  expiresAt: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true }
});

export default mongoose.models.AdminInvite || mongoose.model('AdminInvite', AdminInviteSchema);
