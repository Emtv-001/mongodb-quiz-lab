import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from './_utils/db.js';
import CustomQuestion from './_models/CustomQuestion.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    await connectToDatabase();
    if (req.method === 'GET') {
      const questions = await CustomQuestion.find();
      return res.status(200).json({ success: true, questions });
    }
    if (req.method === 'POST') {
      const { mode } = req.query;
      const input = Array.isArray(req.body) ? req.body : [req.body];
      if (input.some((q: any) => !q || typeof q.id !== 'string' || !q.id.trim() || typeof q.title !== 'string' || !q.title.trim() || typeof q.topic !== 'string' || !q.topic.trim() || !['Easy', 'Medium', 'Hard', 'Expert'].includes(q.difficulty) || !Number.isFinite(q.level) || !Number.isFinite(q.points) || typeof q.type !== 'string')) {
        return res.status(400).json({ success: false, message: 'Invalid question data.' });
      }
      // Never allow client MongoDB metadata to replace database identifiers.
      for (const q of input) { delete q._id; delete q.__v; }
      // Allow bulk insert or single insert
      if (Array.isArray(req.body)) {
        if (mode === 'append' || mode === undefined) {
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
        }
        return res.status(400).json({ success: false, message: 'Use append mode for question imports.' });
      } else {
        const question = await CustomQuestion.findOneAndUpdate(
          { id: req.body.id },
          { $set: req.body },
          { upsert: true, new: true }
        );
        return res.status(200).json({ success: true, question });
      }
    }
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (typeof id !== 'string' || !id) return res.status(400).json({ success: false, message: 'Missing question id.' });
      await CustomQuestion.deleteOne({ id });
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
