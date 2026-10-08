import mongoose from 'mongoose';

const StatementSchema = new mongoose.Schema({
  accountId: { type: String, required: true },
  accountType: { type: String, required: true },
  username: { type: String, required: true },
  displayName: { type: String, required: true },
  role: { type: String },
  reasonCategory: { type: String, required: true },
  statement: { type: String, required: true },
  deletedAt: { type: Date, default: Date.now },
  deletedBy: { type: String, required: true }
}, { strict: false });

export default mongoose.models.Statement || mongoose.model('Statement', StatementSchema);
