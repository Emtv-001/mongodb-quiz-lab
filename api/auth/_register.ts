import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../_utils/db.js';
import Learner from '../_models/Learner.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    await connectToDatabase();
    
    const { email, username, displayName, passwordHash, recoveryPhrase } = req.body;

    const existingUser = await Learner.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] 
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email or username already exists' });
    }

    const newUser = await Learner.create({
      email,
      username,
      displayName,
      passwordHash,
      recoveryPhrase,
      coins: 100,
      xp: 250,
      verified: true
    });

    return res.status(200).json({ success: true, user: newUser });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
