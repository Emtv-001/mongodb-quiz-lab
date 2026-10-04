import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { fingerprintHash, questionsAttempted, questionsCorrect, totalScore, currentStreak, longestStreak, checksum } = req.body || {};

  const salt = process.env.SALT || 'EMTV_INTEGRITY_SALT_9901_SECURE';
  const expectedPayload = `${fingerprintHash}:${questionsAttempted}:${questionsCorrect}:${totalScore}:${currentStreak}:${longestStreak}:${salt}`;
  const computed = crypto.createHash('sha256').update(expectedPayload).digest('hex');

  const isValid = computed === checksum;

  return res.status(200).json({
    verified: isValid,
    serverTimestamp: new Date().toISOString()
  });
}
