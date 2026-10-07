import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from './utils/db.js';
import SiteConfig from './models/SiteConfig.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectToDatabase();
    if (req.method === 'GET') {
      let config = await SiteConfig.findOne();
      if (!config) {
        config = await SiteConfig.create({});
      }
      return res.status(200).json({ success: true, config });
    }
    if (req.method === 'PUT') {
      const config = await SiteConfig.findOneAndUpdate({}, req.body, { new: true, upsert: true });
      return res.status(200).json({ success: true, config });
    }
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
