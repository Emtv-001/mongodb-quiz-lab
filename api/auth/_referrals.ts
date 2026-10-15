import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../_utils/db.js';
import Learner from '../_models/Learner.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectToDatabase();

    // GET /api/auth/referrals?learnerId=... or ?username=...
    if (req.method === 'GET') {
      const { learnerId, username } = req.query;

      if (!learnerId && !username) {
        return res.status(400).json({ success: false, message: 'Missing learnerId or username.' });
      }

      let learner = null;
      if (learnerId) {
        learner = await Learner.findById(learnerId);
      } else if (username) {
        learner = await Learner.findOne({ username: String(username).toLowerCase().trim() });
      }

      if (!learner) {
        return res.status(404).json({ success: false, message: 'Learner not found.' });
      }

      // Auto-provision referral code if missing for legacy accounts
      if (!learner.referralCode) {
        const prefix = learner.username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) || 'USER';
        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        learner.referralCode = `REF-${prefix}-${randomSuffix}`;
        await learner.save();
      }

      // Reconcile and unlock any pending referrals whose referred users reached dedication (750 XP or 350 Coins)
      let hasRepaired = false;
      if (learner.referrals && learner.referrals.length > 0) {
        for (const ref of learner.referrals) {
          if (ref.status === 'pending') {
            const friend = await Learner.findOne({ username: ref.username.toLowerCase() });
            if (friend) {
              ref.currentXp = friend.xp || 0;
              ref.currentCoins = friend.coins || 0;
              const targetXp = ref.targetXp || 750;
              const targetCoins = ref.targetCoins || 350;

              if (ref.currentXp >= targetXp || ref.currentCoins >= targetCoins) {
                ref.status = 'unlocked';
                ref.unlockedAt = new Date();
                const bonusC = ref.bonusCoins || 250;
                const bonusX = ref.bonusXp || 500;

                learner.coins = (learner.coins || 0) + bonusC;
                learner.xp = (learner.xp || 0) + bonusX;
                learner.referralCount = (learner.referralCount || 0) + 1;
                learner.referralBonusCoins = (learner.referralBonusCoins || 0) + bonusC;
                learner.referralBonusXp = (learner.referralBonusXp || 0) + bonusX;

                if (!learner.unlockedBadges) learner.unlockedBadges = [];
                if (learner.referralCount >= 1 && !learner.unlockedBadges.includes('community-spark')) {
                  learner.unlockedBadges.push('community-spark');
                }
                if (learner.referralCount >= 3 && !learner.unlockedBadges.includes('network-builder')) {
                  learner.unlockedBadges.push('network-builder');
                }
                if (learner.referralCount >= 5 && !learner.unlockedBadges.includes('mongodb-ambassador')) {
                  learner.unlockedBadges.push('mongodb-ambassador');
                }
                if (learner.referralCount >= 10 && !learner.unlockedBadges.includes('grand-influencer')) {
                  learner.unlockedBadges.push('grand-influencer');
                }
                hasRepaired = true;
              }
            }
          }
        }
      }

      if (hasRepaired) {
        await learner.save();
      }

      const pendingCount = (learner.referrals || []).filter((r: any) => r.status === 'pending').length;

      return res.status(200).json({
        success: true,
        referralCode: learner.referralCode,
        referredBy: learner.referredBy || null,
        referralCount: learner.referralCount || 0,
        pendingCount,
        referralBonusCoins: learner.referralBonusCoins || 0,
        referralBonusXp: learner.referralBonusXp || 0,
        referrals: learner.referrals || [],
        coins: learner.coins || 0,
        xp: learner.xp || 0
      });
    }

    // POST /api/auth/referrals (Claim a referral code post-registration)
    if (req.method === 'POST') {
      const { learnerId, referralCode } = req.body;

      if (!learnerId || !referralCode) {
        return res.status(400).json({ success: false, message: 'Please provide both learnerId and a valid referral code.' });
      }

      const learner = await Learner.findById(learnerId);
      if (!learner) {
        return res.status(404).json({ success: false, message: 'Learner account not found.' });
      }

      if (learner.referredBy) {
        return res.status(400).json({
          success: false,
          message: `You have already claimed a referral bonus from @${learner.referredBy}. Each account can only be referred once.`
        });
      }

      const cleanCode = String(referralCode).trim().toUpperCase();
      const referrer = await Learner.findOne({
        $or: [
          { referralCode: cleanCode },
          { username: cleanCode.toLowerCase() }
        ]
      });

      if (!referrer) {
        return res.status(404).json({ success: false, message: 'Invalid referral code or referrer not found.' });
      }

      if (referrer.username.toLowerCase() === learner.username.toLowerCase()) {
        return res.status(400).json({ success: false, message: 'You cannot use your own referral code.' });
      }

      // 1. Credit Learner with INSTANT Welcome Bonus (+150 Coins, +250 XP)
      const learnerBonusCoins = 150;
      const learnerBonusXp = 250;
      learner.coins = (learner.coins || 0) + learnerBonusCoins;
      learner.xp = (learner.xp || 0) + learnerBonusXp;
      learner.referredBy = referrer.username;
      learner.referralBonusCoins = (learner.referralBonusCoins || 0) + learnerBonusCoins;
      learner.referralBonusXp = (learner.referralBonusXp || 0) + learnerBonusXp;
      await learner.save();

      // 2. Check if learner already demonstrated dedication (XP >= 750 or Coins >= 350)
      const targetXp = 750;
      const targetCoins = 350;
      const hasDedication = (learner.xp >= targetXp) || (learner.coins >= targetCoins);

      if (!referrer.referrals) referrer.referrals = [];

      if (hasDedication) {
        // Learner has already spent time learning: Unlock referrer immediately
        const referrerCoins = 250;
        const referrerXp = 500;
        referrer.coins = (referrer.coins || 0) + referrerCoins;
        referrer.xp = (referrer.xp || 0) + referrerXp;
        referrer.referralCount = (referrer.referralCount || 0) + 1;
        referrer.referralBonusCoins = (referrer.referralBonusCoins || 0) + referrerCoins;
        referrer.referralBonusXp = (referrer.referralBonusXp || 0) + referrerXp;

        referrer.referrals.unshift({
          username: learner.username,
          displayName: learner.displayName || learner.username,
          date: new Date(),
          status: 'unlocked',
          unlockedAt: new Date(),
          targetXp,
          targetCoins,
          currentXp: learner.xp,
          currentCoins: learner.coins,
          bonusCoins: referrerCoins,
          bonusXp: referrerXp
        });

        // Milestone Badges for referrer
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

        return res.status(200).json({
          success: true,
          message: `Referral applied! You earned +${learnerBonusCoins} MongoCoins and +${learnerBonusXp} XP! Your friend @${referrer.username} was rewarded as well.`,
          user: learner,
          referrerUsername: referrer.username
        });
      } else {
        // Learner still needs to demonstrate dedication by reaching 750 XP or 350 Coins (~1-2h of practice)
        referrer.referrals.unshift({
          username: learner.username,
          displayName: learner.displayName || learner.username,
          date: new Date(),
          status: 'pending',
          unlockedAt: null,
          targetXp,
          targetCoins,
          currentXp: learner.xp,
          currentCoins: learner.coins,
          bonusCoins: 250,
          bonusXp: 500
        });

        await referrer.save();

        return res.status(200).json({
          success: true,
          message: `Referral applied! You received an instant welcome bonus of +${learnerBonusCoins} MongoCoins and +${learnerBonusXp} XP! Your friend @${referrer.username} will earn their referral bonus once you show dedication by reaching ${targetXp} XP or ${targetCoins} Coins through practice!`,
          user: learner,
          referrerUsername: referrer.username
        });
      }
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('Referrals endpoint error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
}
