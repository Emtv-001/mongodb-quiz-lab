import mongoose from 'mongoose';

const ActivityRecordSchema = new mongoose.Schema({
  date: { type: String, required: true },
  questionsAttempted: { type: Number, default: 0 },
  questionsCorrect: { type: Number, default: 0 },
  earnedPoints: { type: Number, default: 0 }
}, { _id: false });

const TopicStatsSchema = new mongoose.Schema({
  attempted: { type: Number, default: 0 },
  correct: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 },
  earnedPoints: { type: Number, default: 0 }
}, { _id: false });

const ProgressSchema = new mongoose.Schema({
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Learner', required: true, unique: true },
  questionsAttempted: { type: Number, default: 0 },
  questionsCorrect: { type: Number, default: 0 },
  questionsPartial: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  totalMaxScore: { type: Number, default: 0 },
  bestMockScore: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActiveDate: { type: String },
  activityHistory: { type: Map, of: ActivityRecordSchema, default: {} },
  topicStats: { type: Map, of: TopicStatsSchema, default: {} },
  completedSessions: [{ type: mongoose.Schema.Types.Mixed }],
  bookmarkedQuestionIds: [{ type: String }],
  masteredFlashcardIds: [{ type: String }],
  spacedRepetition: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Progress || mongoose.model('Progress', ProgressSchema);
