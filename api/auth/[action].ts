import type { VercelRequest, VercelResponse } from '@vercel/node';
import loginHandler from './_login.js';
import registerHandler from './_register.js';
import resetPasswordHandler from './_reset-password.js';
import verifyHandler from './_verify.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;
  
  if (action === 'login') return loginHandler(req, res);
  if (action === 'register') return registerHandler(req, res);
  if (action === 'reset-password') return resetPasswordHandler(req, res);
  if (action === 'verify') return verifyHandler(req, res);

  return res.status(404).json({ success: false, message: 'Route not found' });
}
