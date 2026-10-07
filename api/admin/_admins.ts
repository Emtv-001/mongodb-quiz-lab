import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../_utils/db.js';
import Admin from '../_models/Admin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectToDatabase();
    
    if (req.method === 'GET') {
      const admins = await Admin.find({}, '-passwordHash').sort({ createdAt: 1 });
      return res.status(200).json({ success: true, admins });
    }
    
    if (req.method === 'POST') {
      const admin = await Admin.create(req.body);
      return res.status(200).json({ success: true, admin });
    }

    if (req.method === 'PUT') {
      const { id, updates } = req.body;
      const admin = await Admin.findByIdAndUpdate(id, { $set: updates }, { new: true });
      return res.status(200).json({ success: true, admin });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await Admin.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: 'Admin deleted' });
    }
    
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
