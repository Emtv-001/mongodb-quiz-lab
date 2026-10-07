import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../utils/db';
import Learner from '../models/Learner';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectToDatabase();
    
    if (req.method === 'GET') {
      const users = await Learner.find({}, '-passwordHash').sort({ xp: -1 });
      return res.status(200).json({ success: true, users });
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ success: false, message: 'Missing user id' });
      
      await Learner.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: 'User deleted' });
    }
    
    if (req.method === 'PUT') {
      const { id, updates } = req.body;
      if (!id || !updates) return res.status(400).json({ success: false, message: 'Invalid payload' });
      
      // Prevent updating sensitive fields via basic PUT
      delete updates.passwordHash;
      delete updates.recoveryPhrase;
      
      const user = await Learner.findByIdAndUpdate(id, { $set: updates }, { new: true });
      return res.status(200).json({ success: true, user });
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('Admin Users API error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
