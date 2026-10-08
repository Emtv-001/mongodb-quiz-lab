import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from './_utils/db.js';
import Notification from './_models/Notification.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectToDatabase();
    
    if (req.method === 'GET') {
      const { audience } = req.query;
      const filter: any = {};
      
      if (audience === 'learners') filter.audience = { $in: ['all', 'learners'] };
      else if (audience === 'admins') filter.audience = { $in: ['all', 'admins'] };
      
      // Only fetch notifications that haven't expired, or have no expiration
      filter.$or = [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }, { expiresAt: null }];

      const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(10);
      return res.status(200).json({ success: true, notifications });
    }
    
    if (req.method === 'POST') {
      const notification = await Notification.create(req.body);
      return res.status(200).json({ success: true, notification });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await Notification.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: 'Deleted' });
    }
    
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
