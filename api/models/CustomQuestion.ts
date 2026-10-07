import mongoose from 'mongoose';

const CustomQuestionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  topic: { type: String, required: true },
  level: { type: Number, required: true },
  difficulty: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  scenario: { type: String },
  dataset: { type: String },
  expectedCommand: { type: String },
  options: [{ type: String }],
  correctOptionIndex: { type: Number },
  explanation: { type: String },
  misconception: { type: String },
  conceptFocus: { type: String },
  points: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.CustomQuestion || mongoose.model('CustomQuestion', CustomQuestionSchema);
