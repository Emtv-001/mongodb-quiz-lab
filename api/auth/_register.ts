import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../_utils/db.js';
import Learner from '../_models/Learner.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();
    
    const { email, username, displayName, passwordHash, recoveryPhrase, referralCode: inputRefCode } = req.body;

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.toLowerCase().trim();

    const existingUser = await Learner.findOne({ 
      $or: [{ email: cleanEmail }, { username: cleanUsername }] 
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email or username already exists' });
    }

    // Generate unique referral code for this new learner
    const prefix = cleanUsername.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) || 'USER';
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const userRefCode = `REF-${prefix}-${randomSuffix}`;

    let referredByUsername: string | null = null;
    let bonusCoinsForNewUser = 0;
    let bonusXpForNewUser = 0;

    // Check referral code if provided
    if (inputRefCode && typeof inputRefCode === 'string' && inputRefCode.trim()) {
      const cleanInputRef = inputRefCode.trim().toUpperCase();
      const referrerUser = await Learner.findOne({
        $or: [
          { referralCode: cleanInputRef },
          { username: cleanInputRef.toLowerCase() }
        ]
      });

      // Prevent self-referral
      if (referrerUser && referrerUser.username.toLowerCase() !== cleanUsername) {
        referredByUsername = referrerUser.username;
        bonusCoinsForNewUser = 150; // New user gets 100 base + 150 referral bonus = 250 coins
        bonusXpForNewUser = 250;    // New user gets 250 base + 250 referral bonus = 500 XP

        // Credit the referrer: +250 Coins & +500 XP
        const referrerCoinsReward = 250;
        const referrerXpReward = 500;

        referrerUser.coins = (referrerUser.coins || 0) + referrerCoinsReward;
        referrerUser.xp = (referrerUser.xp || 0) + referrerXpReward;
        referrerUser.referralCount = (referrerUser.referralCount || 0) + 1;
        referrerUser.referralBonusCoins = (referrerUser.referralBonusCoins || 0) + referrerCoinsReward;
        referrerUser.referralBonusXp = (referrerUser.referralBonusXp || 0) + referrerXpReward;

        if (!referrerUser.referrals) referrerUser.referrals = [];
        referrerUser.referrals.unshift({
          username: cleanUsername,
          displayName: displayName || cleanUsername,
          date: new Date(),
          bonusCoins: referrerCoinsReward,
          bonusXp: referrerXpReward
        });

        // Award referral badges if milestone achieved
        if (!referrerUser.unlockedBadges) referrerUser.unlockedBadges = [];
        if (referrerUser.referralCount >= 1 && !referrerUser.unlockedBadges.includes('community-spark')) {
          referrerUser.unlockedBadges.push('community-spark');
        }
        if (referrerUser.referralCount >= 3 && !referrerUser.unlockedBadges.includes('network-builder')) {
          referrerUser.unlockedBadges.push('network-builder');
        }
        if (referrerUser.referralCount >= 5 && !referrerUser.unlockedBadges.includes('mongodb-ambassador')) {
          referrerUser.unlockedBadges.push('mongodb-ambassador');
        }
        if (referrerUser.referralCount >= 10 && !referrerUser.unlockedBadges.includes('grand-influencer')) {
          referrerUser.unlockedBadges.push('grand-influencer');
        }

        await referrerUser.save();
      }
    }

    const baseCoins = 100;
    const baseXp = 250;
    const totalCoins = baseCoins + bonusCoinsForNewUser;
    const totalXp = baseXp + bonusXpForNewUser;

    const newUser = await Learner.create({
      email: cleanEmail,
      username: cleanUsername,
      displayName: displayName || cleanUsername,
      passwordHash,
      recoveryPhrase,
      coins: totalCoins,
      xp: totalXp,
      verified: true,
      referralCode: userRefCode,
      referredBy: referredByUsername,
      referralCount: 0,
      referralBonusCoins: bonusCoinsForNewUser,
      referralBonusXp: bonusXpForNewUser,
      referrals: []
    });

    return res.status(200).json({
      success: true,
      user: newUser,
      referralApplied: Boolean(referredByUsername),
      referredBy: referredByUsername,
      bonusCoins: bonusCoinsForNewUser,
      bonusXp: bonusXpForNewUser
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
