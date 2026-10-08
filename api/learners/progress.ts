import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../_utils/db.js';
import Progress from '../_models/Progress.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectToDatabase();
    
    if (req.method === 'GET') {
      const { learnerId } = req.query;
      if (!learnerId) return res.status(400).json({ success: false, message: 'Missing learnerId' });
      
      let progress = await Progress.findOne({ learnerId });
      
      if (!progress) {
        progress = {
          questionsAttempted: 0,
          questionsCorrect: 0,
          questionsPartial: 0,
          totalScore: 0,
          totalMaxScore: 0,
          bestMockScore: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: '',
          activityHistory: {},
          topicStats: {},
          completedSessions: [],
          bookmarkedQuestionIds: [],
          masteredFlashcardIds: [],
          spacedRepetition: {}
        };
      }
      
      return res.status(200).json({ success: true, progress });
    }
    
    if (req.method === 'POST') {
      const { learnerId, progressData } = req.body;
      if (!learnerId || !progressData) return res.status(400).json({ success: false, message: 'Invalid payload' });
      
      const updatedProgress = await Progress.findOneAndUpdate(
        { learnerId },
        { $set: progressData },
        { new: true, upsert: true }
      );
      
      return res.status(200).json({ success: true, progress: updatedProgress });
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('Progress API error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
