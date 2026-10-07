import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../utils/db.js';
import Learner from '../models/Learner.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();
    
    const { emailOrUsername, passwordHash } = req.body;
    const clean = emailOrUsername.toLowerCase();

    const user = await Learner.findOne({ 
      $or: [{ email: clean }, { username: clean }] 
    });

    if (!user || user.passwordHash !== passwordHash) {
      return res.status(401).json({ success: false, message: 'Invalid email/username or password.' });
    }

    return res.status(200).json({ success: true, user });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
