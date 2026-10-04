import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : req.socket.remoteAddress || '127.0.0.1';

  const salt = process.env.SALT || 'EMTV_LEARNER_SECRET_SALT_2026';
  const hash = crypto.createHash('sha256').update(`${ip}:${salt}`).digest('hex');
  const pseudonym = `MongoLearner-${hash.slice(0, 4).toUpperCase()}`;

  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(200).json({
    pseudonym,
    fingerprintHash: hash,
    timestamp: new Date().toISOString()
  });
}
