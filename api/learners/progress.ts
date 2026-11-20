import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../_utils/db.js';
import Progress from '../_models/Progress.js';
import Learner from '../_models/Learner.js';
import { readLearnerSession, clearLearnerSession } from '../_utils/learnerSession.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.headers['sec-fetch-site'] === 'cross-site') return res.status(403).json({ success: false, message: 'Request denied.' });
  if (req.method === 'DELETE') {
    clearLearnerSession(res);
    return res.status(204).end();
  }
  try {
    await connectToDatabase();
    const session = readLearnerSession(req);
    const ownerId = req.method === 'GET' ? req.query.learnerId : req.body?.learnerId;
    if (!session || session.id !== ownerId) return res.status(401).json({ success: false, message: 'Sign out and sign in online to access your saved progress.' });
    const owner = await Learner.findById(session.id);
    if (!owner || !session.authenticates(owner.passwordHash)) return res.status(401).json({ success: false, message: 'Please sign in again.' });
    
    if (req.method === 'GET') {
      const { learnerId } = req.query;
      if (typeof learnerId !== 'string' || !/^[a-f0-9]{24}$/i.test(learnerId)) return res.status(400).json({ success: false, message: 'Invalid learnerId' });
      
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
      
      return res.status(200).json({ success: true, progress, accountStats: {
        coins: owner.coins, xp: owner.xp,
        referralBonusCoins: owner.referralBonusCoins, referralBonusXp: owner.referralBonusXp,
        referralCount: owner.referralCount, unlockedBadges: owner.unlockedBadges
      } });
    }
    
    if (req.method === 'POST') {
      const { learnerId, progressData, coins, xp } = req.body;
      if (typeof learnerId !== 'string' || !/^[a-f0-9]{24}$/i.test(learnerId) || !progressData || typeof progressData !== 'object' || Array.isArray(progressData)) return res.status(400).json({ success: false, message: 'Invalid payload' });
      const fields = ['questionsAttempted', 'questionsCorrect', 'questionsPartial', 'totalScore', 'totalMaxScore', 'bestMockScore', 'currentStreak', 'longestStreak', 'lastActiveDate', 'activityHistory', 'topicStats', 'completedSessions', 'bookmarkedQuestionIds', 'masteredFlashcardIds', 'spacedRepetition', 'activeSession'];
      const savedData = Object.fromEntries(fields.filter(key => key in progressData).map(key => [key, progressData[key]]));
      for (const key of fields.slice(0, 8)) {
        if (key in savedData && (typeof savedData[key] !== 'number' || !Number.isFinite(savedData[key]) || savedData[key] < 0)) return res.status(400).json({ success: false, message: 'Invalid progress value' });
      }
      
      const updatedProgress = await Progress.findOneAndUpdate(
        { learnerId },
        { $set: { ...savedData, updatedAt: new Date() } },
        { new: true, upsert: true, runValidators: true }
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
