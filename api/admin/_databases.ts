import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../_utils/db.js';
import DatabaseCollection from '../_models/DatabaseCollection.js';
import { DEFAULT_DATABASE_COLLECTIONS } from '../_utils/defaultDatabases.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Prevent aggressive edge and browser caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    await connectToDatabase();

    if (req.method === 'GET') {
      let collections = await DatabaseCollection.find().sort({ createdAt: 1 }).lean();
      
      // Auto-seed default collections into Atlas if collection is empty
      if (!collections || collections.length === 0) {
        try {
          await DatabaseCollection.insertMany(DEFAULT_DATABASE_COLLECTIONS);
          collections = await DatabaseCollection.find().sort({ createdAt: 1 }).lean();
        } catch (seedErr: any) {
          console.error("Auto-seeding databases error:", seedErr);
        }
      }

      return res.status(200).json({ success: true, collections: collections || [] });
    }

    if (req.method === 'POST') {
      const { mode } = req.query;

      if (Array.isArray(req.body)) {
        if (mode === 'replace') {
          await DatabaseCollection.deleteMany({});
          await DatabaseCollection.insertMany(req.body);
        } else {
          const bulkOps = req.body.map((col: any) => ({
            updateOne: {
              filter: { id: col.id },
              update: { $set: col },
              upsert: true
            }
          }));
          if (bulkOps.length > 0) {
            await DatabaseCollection.bulkWrite(bulkOps);
          }
        }
        const collections = await DatabaseCollection.find().sort({ createdAt: 1 }).lean();
        return res.status(200).json({ success: true, collections });
      } else {
        const collection = await DatabaseCollection.findOneAndUpdate(
          { id: req.body.id },
          { $set: req.body },
          { upsert: true, new: true }
        ).lean();
        return res.status(200).json({ success: true, collection });
      }
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      if (!id) {
        return res.status(400).json({ success: false, message: 'Collection ID is required for update' });
      }
      const collection = await DatabaseCollection.findOneAndUpdate(
        { id },
        { $set: updates },
        { new: true }
      ).lean();
      return res.status(200).json({ success: true, collection });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ success: false, message: 'Collection ID is required for deletion' });
      }
      await DatabaseCollection.findOneAndDelete({ id });
      return res.status(200).json({ success: true, message: 'Collection deleted successfully' });
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    console.error("Database collections API error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
