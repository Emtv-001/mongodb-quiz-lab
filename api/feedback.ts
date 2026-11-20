import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from './_utils/db.js';
import Feedback from './_models/Feedback.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    await connectToDatabase();
    if (req.method === 'GET') {
      const feedback = await Feedback.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, feedback });
    }
    if (req.method === 'POST') {
      const { type, message, senderFingerprint, senderPseudonym } = req.body ?? {};
      if (!['complaint', 'suggestion'].includes(type) || typeof message !== 'string' || message.trim().length < 10 || message.length > 10000 || typeof senderFingerprint !== 'string' || !senderFingerprint || typeof senderPseudonym !== 'string' || !senderPseudonym) {
        return res.status(400).json({ success: false, message: 'Invalid feedback.' });
      }
      const newFeedback = await Feedback.create({ type, message: message.trim(), senderFingerprint, senderPseudonym });
      return res.status(200).json({ success: true, message: 'Your feedback has been submitted successfully.', feedback: newFeedback });
    }
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
