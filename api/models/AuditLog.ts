import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  timestamp: { type: String, required: true },
  adminUsername: { type: String, required: true },
  action: { type: String, required: true },
  category: { type: String, required: true },
  details: { type: String, required: true }
});

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
