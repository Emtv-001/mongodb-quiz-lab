import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../_utils/db.js';
import Admin from '../_models/Admin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectToDatabase();
    
    if (req.method === 'GET') {
      const admins = await Admin.find({}, '-passwordHash').sort({ createdAt: 1 });
      return res.status(200).json({ success: true, admins });
    }
    
    if (req.method === 'POST') {
      const admin = await Admin.create(req.body);
      return res.status(200).json({ success: true, admin });
    }

    if (req.method === 'PUT') {
      const { id, username, email, updates } = req.body;
      let admin = null;
      if (id && id.length === 24) {
        admin = await Admin.findByIdAndUpdate(id, { $set: updates }, { new: true });
      }
      if (!admin && username) {
        admin = await Admin.findOneAndUpdate({ username: username.toLowerCase().trim() }, { $set: updates }, { new: true });
      }
      if (!admin && email) {
        admin = await Admin.findOneAndUpdate({ email: email.toLowerCase().trim() }, { $set: updates }, { new: true });
      }
      return res.status(200).json({ success: true, admin });
    }


    if (req.method === 'DELETE') {
      const { id } = req.query;
      const target = await Admin.findById(id);
      if (target && (target.role === 'super_admin' || target.role === 'super-admin' || target.username.toLowerCase() === 'admin' || target.email?.toLowerCase() === 'uzooejims@gmail.com' || target._id.toString() === 'admin_master_1')) {
        return res.status(403).json({ success: false, message: 'Super Admin accounts cannot be deleted.' });
      }
      await Admin.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: 'Admin deleted' });
    }
    
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
