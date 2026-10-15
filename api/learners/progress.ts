import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../_utils/db.js';
import Progress from '../_models/Progress.js';
import Learner from '../_models/Learner.js';

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
      const { learnerId, progressData, coins, xp } = req.body;
      if (!learnerId || !progressData) return res.status(400).json({ success: false, message: 'Invalid payload' });
      
      const updatedProgress = await Progress.findOneAndUpdate(
        { learnerId },
        { $set: progressData },
        { new: true, upsert: true }
      );

      // Synchronize Learner model and unlock pending referrer if dedication threshold is reached
      if (learnerId) {
        try {
          const learner = await Learner.findById(learnerId);
          if (learner) {
            if (typeof coins === 'number' && coins > (learner.coins || 0)) {
              learner.coins = coins;
            }
            if (typeof xp === 'number' && xp > (learner.xp || 0)) {
              learner.xp = xp;
            }
            learner.lastActive = new Date();
            await learner.save();

            // Dedication check: If learner was referred by someone and hits 750 XP or 350 Coins
            const currentXp = learner.xp || 0;
            const currentCoins = learner.coins || 0;
            if (learner.referredBy && (currentXp >= 750 || currentCoins >= 350)) {
              const referrer = await Learner.findOne({ username: learner.referredBy.toLowerCase() });
              if (referrer && referrer.referrals) {
                const ref = referrer.referrals.find((r: any) => r.username.toLowerCase() === learner.username.toLowerCase());
                if (ref && ref.status === 'pending') {
                  ref.status = 'unlocked';
                  ref.unlockedAt = new Date();
                  ref.currentXp = currentXp;
                  ref.currentCoins = currentCoins;
                  
                  const bonusC = ref.bonusCoins || 250;
                  const bonusX = ref.bonusXp || 500;
                  
                  referrer.coins = (referrer.coins || 0) + bonusC;
                  referrer.xp = (referrer.xp || 0) + bonusX;
                  referrer.referralCount = (referrer.referralCount || 0) + 1;
                  referrer.referralBonusCoins = (referrer.referralBonusCoins || 0) + bonusC;
                  referrer.referralBonusXp = (referrer.referralBonusXp || 0) + bonusX;

                  if (!referrer.unlockedBadges) referrer.unlockedBadges = [];
                  if (referrer.referralCount >= 1 && !referrer.unlockedBadges.includes('community-spark')) {
                    referrer.unlockedBadges.push('community-spark');
                  }
                  if (referrer.referralCount >= 3 && !referrer.unlockedBadges.includes('network-builder')) {
                    referrer.unlockedBadges.push('network-builder');
                  }
                  if (referrer.referralCount >= 5 && !referrer.unlockedBadges.includes('mongodb-ambassador')) {
                    referrer.unlockedBadges.push('mongodb-ambassador');
                  }
                  if (referrer.referralCount >= 10 && !referrer.unlockedBadges.includes('grand-influencer')) {
                    referrer.unlockedBadges.push('grand-influencer');
                  }

                  await referrer.save();
                }
              }
            }
          }
        } catch (syncErr) {
          console.warn('Error updating Learner stats on progress sync:', syncErr);
        }
      }
      
      return res.status(200).json({ success: true, progress: updatedProgress });
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('Progress API error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
