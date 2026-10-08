import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../_utils/db.js';
import Learner from '../_models/Learner.js';
import Admin from '../_models/Admin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

    await connectToDatabase();
    
    if (req.method === 'GET') {
      const { id, role } = req.query;
      
      if (!id || !role) {
        return res.status(400).json({ valid: false, message: 'Missing parameters' });
      }

      if (role === 'admin') {
        const admin = await Admin.findById(id);
        if (!admin) {
          return res.status(200).json({ valid: false, reason: 'deleted', message: 'Your admin account has been deleted by a Super Admin.' });
        }
        if (admin.status === 'suspended') {
          return res.status(200).json({ valid: false, reason: 'suspended', message: 'Your admin account has been suspended.' });
        }
        // Return latest admin data so frontend can sync
        return res.status(200).json({ valid: true, user: admin });
      } 
      else if (role === 'learner') {
        const learner = await Learner.findById(id);
        if (!learner) {
          return res.status(200).json({ valid: false, reason: 'deleted', message: 'Your learner account has been permanently deleted by an administrator.' });
        }
        if (learner.verified === false) {
          return res.status(200).json({ valid: false, reason: 'suspended', message: 'Your learner account has been suspended or deactivated.' });
        }
        // Return latest learner data so frontend can sync
        return res.status(200).json({ valid: true, user: learner });
      }

      return res.status(400).json({ valid: false, message: 'Invalid role' });
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
