import mongoose from 'mongoose';

const LearnerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  username: { type: String, required: true, unique: true, lowercase: true },
  displayName: { type: String, required: true },
  passwordHash: { type: String, required: true },
  recoveryPhrase: { type: String, required: true },
  verified: { type: Boolean, default: false },
  coins: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  tier: { type: String, default: 'Bronze' },
  rankNumber: { type: Number, default: 0 },
  unlockedBadges: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

export default mongoose.models.Learner || mongoose.model('Learner', LearnerSchema);
