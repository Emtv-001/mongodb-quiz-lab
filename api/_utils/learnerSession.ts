import { createHmac, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const cookie = 'quizlab_progress_session';
const secret = () => process.env.ADMIN_SESSION_SECRET || process.env.MONGODB_URI;
const sign = (value: string, passwordHash: string) => createHmac('sha256', secret()!).update(JSON.stringify(['learner-progress', value, passwordHash])).digest('hex');

export function setLearnerSession(res: VercelResponse, id: string, passwordHash: string) {
  if (!secret()) return;
  const payload = id + '.' + (Math.floor(Date.now() / 1000) + 86400);
  res.setHeader('Set-Cookie', cookie + '=' + payload + '.' + sign(payload, passwordHash) + '; Path=/api/learners; HttpOnly; Secure; SameSite=Strict; Max-Age=86400');
}

export function clearLearnerSession(res: VercelResponse) {
  res.setHeader('Set-Cookie', cookie + '=; Path=/api/learners; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
}

export function readLearnerSession(req: VercelRequest) {
  const value = req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(cookie + '='))?.slice(cookie.length + 1);
  if (!secret() || !value || !/^[a-f0-9]{24}\.[0-9]{10}\.[a-f0-9]{64}$/.test(value)) return;
  const [id, expires, digest] = value.split('.');
  if (+expires <= Date.now() / 1000) return;
  return { id, authenticates: (hash: string) => timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(sign(id + '.' + expires, hash), 'hex')) };
}
