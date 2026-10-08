import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../../_utils/db.js';
import Admin from '../../_models/Admin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  try {
    await connectToDatabase();
    const { username, passwordHash } = req.body;
    const clean = username.toLowerCase();
    
    // Check if DB is empty, auto-create master admin if so
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0 && (clean === 'admin' || clean === 'admin@mongodbquizlab.com')) {
      const masterAdmin = await Admin.create({
        username: 'admin',
        email: 'admin@mongodbquizlab.com',
        displayName: 'Master Admin',
        passwordHash: passwordHash, // accept whatever first login uses as master pass
        recoveryPhrase: '09018537763',
        role: 'super-admin',
        permissions: {
          canManageSubAdmins: true, canEditBranding: true, canManageTabs: true, canManageDatabases: true,
          canManageQuestions: true, canResetSystem: true, canViewLearnerData: true, canExportData: true
        }
      });
      return res.status(200).json({ success: true, user: masterAdmin });
    }

    const user = await Admin.findOne({ $or: [{ email: clean }, { username: clean }] });
    
    if (!user || user.passwordHash !== passwordHash) {
      // Hardcoded fallback for master admin
      if (clean === 'admin' && passwordHash === 'bfb5c777e4cfdf82fc3bf0e737c35f2cb0985289993309a473fb78b4bd453b34') { 
        return res.status(200).json({ 
          success: true, 
          user: { _id: 'master', username: 'admin', role: 'super-admin', permissions: { canManageSubAdmins: true, canEditBranding: true, canManageTabs: true, canManageDatabases: true, canManageQuestions: true, canResetSystem: true, canViewLearnerData: true, canExportData: true } }
        });
      }
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }
    return res.status(200).json({ success: true, user });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
