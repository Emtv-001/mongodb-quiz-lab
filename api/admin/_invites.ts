import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../_utils/db.js';
import AdminInvite from '../_models/AdminInvite.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectToDatabase();
    
    if (req.method === 'GET') {
      const invites = await AdminInvite.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, invites });
    }
    
    if (req.method === 'POST') {
      const invite = await AdminInvite.create(req.body);
      return res.status(200).json({ success: true, invite });
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.query;
      await AdminInvite.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: 'Invite revoked' });
    }
    
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
