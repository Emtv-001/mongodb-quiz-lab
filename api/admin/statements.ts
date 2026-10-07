import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../utils/db.js';
import Statement from '../models/Statement.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectToDatabase();
    if (req.method === 'GET') {
      const statements = await Statement.find().sort({ timestamp: -1 });
      return res.status(200).json({ success: true, statements });
    }
    if (req.method === 'POST') {
      const statement = await Statement.create(req.body);
      return res.status(200).json({ success: true, statement });
    }
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
