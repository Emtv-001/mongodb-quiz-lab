import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../_utils/db.js';
import Learner from '../_models/Learner.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  try {
    await connectToDatabase();
    const { email, username, newPasswordHash } = req.body;
    
    if (!email && !username) {
      return res.status(400).json({ success: false, message: 'Missing identifier' });
    }

    const user = await Learner.findOne({ $or: [{ email: email?.toLowerCase() }, { username: username?.toLowerCase() }] });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    user.passwordHash = newPasswordHash;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password reset successful!' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
