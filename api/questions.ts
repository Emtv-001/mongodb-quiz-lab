import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from './_utils/db.js';
import CustomQuestion from './_models/CustomQuestion.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectToDatabase();
    if (req.method === 'GET') {
      const questions = await CustomQuestion.find();
      return res.status(200).json({ success: true, questions });
    }
    if (req.method === 'POST') {
      // Allow bulk insert or single insert
      if (Array.isArray(req.body)) {
        await CustomQuestion.deleteMany({}); // replace all for now, or just insert
        const questions = await CustomQuestion.insertMany(req.body);
        return res.status(200).json({ success: true, questions });
      } else {
        const question = await CustomQuestion.create(req.body);
        return res.status(200).json({ success: true, question });
      }
    }
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
