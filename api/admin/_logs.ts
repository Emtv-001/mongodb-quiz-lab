import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../_utils/db.js';
import AuditLog from '../_models/AuditLog.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectToDatabase();
    
    if (req.method === 'GET') {
      const logs = await AuditLog.find().sort({ _id: -1 }).limit(100);
      return res.status(200).json({ success: true, logs });
    }
    
    if (req.method === 'POST') {
      const log = await AuditLog.create(req.body);
      return res.status(200).json({ success: true, log });
    }
    
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
