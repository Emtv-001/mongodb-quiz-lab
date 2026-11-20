import { createHmac, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const cookieName = 'quizlab_analytics_admin';
const lifetime = 8 * 60 * 60;
const key = () => process.env.ADMIN_SESSION_SECRET || process.env.MONGODB_URI;

function signature(payload: string, passwordHash: string) {
  return createHmac('sha256', key()!).update(JSON.stringify(['quizlab-admin-analytics', payload, passwordHash])).digest('hex');
}

export function setAnalyticsSession(res: VercelResponse, id: string, passwordHash: string) {
  if (!key()) return;
  const payload = id + '.' + (Math.floor(Date.now() / 1000) + lifetime);
  res.setHeader('Set-Cookie', cookieName + '=' + payload + '.' + signature(payload, passwordHash) +
    '; Path=/api/admin; HttpOnly; SameSite=Strict; Secure; Max-Age=' + lifetime);
}

export function clearAnalyticsSession(res: VercelResponse) {
  res.setHeader('Set-Cookie', cookieName + '=; Path=/api/admin; HttpOnly; SameSite=Strict; Secure; Max-Age=0');
}

export function readAnalyticsSession(req: VercelRequest) {
  const value = req.headers.cookie?.split(';').map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
  if (!key() || !value || !/^[a-f0-9]{24}\.[0-9]{10}\.[a-f0-9]{64}$/.test(value)) return;
  const [id, expires, digest] = value.split('.');
  if (Number(expires) <= Math.floor(Date.now() / 1000)) return;
  return {
    id,
    authenticates: (passwordHash: string) => timingSafeEqual(
      Buffer.from(digest, 'hex'), Buffer.from(signature(id + '.' + expires, passwordHash), 'hex')
    )
  };
}
