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
      const { mode } = req.query;
      // Allow bulk insert or single insert
      if (Array.isArray(req.body)) {
        if (mode === 'append') {
          // Upsert each question by id so we preserve existing custom questions
          const bulkOps = req.body.map((q: any) => ({
            updateOne: {
              filter: { id: q.id },
              update: { $set: q },
              upsert: true
            }
          }));
          if (bulkOps.length > 0) {
            await CustomQuestion.bulkWrite(bulkOps);
          }
          const questions = await CustomQuestion.find();
          return res.status(200).json({ success: true, questions });
        } else {
          await CustomQuestion.deleteMany({}); // replace all (import/restore)
          const questions = await CustomQuestion.insertMany(req.body);
          return res.status(200).json({ success: true, questions });
        }
      } else {
        const question = await CustomQuestion.findOneAndUpdate(
          { id: req.body.id },
          { $set: req.body },
          { upsert: true, new: true }
        );
        return res.status(200).json({ success: true, question });
      }
    }
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
