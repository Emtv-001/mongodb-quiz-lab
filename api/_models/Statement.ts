import mongoose from 'mongoose';

const StatementSchema = new mongoose.Schema({
  targetId: { type: String, required: true },
  targetRole: { type: String, required: true },
  targetName: { type: String, required: true },
  reason: { type: String, required: true },
  statement: { type: String, required: true },
  executorUsername: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.models.Statement || mongoose.model('Statement', StatementSchema);
