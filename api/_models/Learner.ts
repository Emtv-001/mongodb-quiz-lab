import mongoose from 'mongoose';

const ReferralRecordSchema = new mongoose.Schema({
  username: { type: String, required: true },
  displayName: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  bonusCoins: { type: Number, default: 250 },
  bonusXp: { type: Number, default: 500 }
}, { _id: false });

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
  referralCode: { type: String, uppercase: true, trim: true, unique: true, sparse: true, index: true },
  referredBy: { type: String, default: null },
  referralCount: { type: Number, default: 0 },
  referralBonusCoins: { type: Number, default: 0 },
  referralBonusXp: { type: Number, default: 0 },
  referrals: [ReferralRecordSchema],
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
}, { strict: false });

export default mongoose.models.Learner || mongoose.model('Learner', LearnerSchema);
