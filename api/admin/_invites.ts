import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../_utils/db.js';
import AdminInvite from '../_models/AdminInvite.js';
import Admin from '../_models/Admin.js';
import mongoose from 'mongoose';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    await connectToDatabase();
    
    if (req.method === 'GET') {
      // Repair legacy acceptances whose follow-up invite deletion failed.
      const pending = await AdminInvite.find({ status: 'pending' });
      for (const invite of pending) {
        const admin = await Admin.findOne({ recoveryPhrase: invite.recoveryPhrase, role: invite.role, createdBy: invite.createdBy });
        if (admin) await AdminInvite.updateOne({ _id: invite._id, status: 'pending' }, { $set: { status: 'accepted', acceptedBy: admin._id, acceptedAt: admin.createdAt } });
      }
      const invites = await AdminInvite.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, invites });
    }
    
    if (req.method === 'POST') {
      if (req.body?.action === 'accept') {
        const { invitationCode, username, email, displayName, passwordHash } = req.body;
        if (typeof invitationCode !== 'string' || typeof username !== 'string' || !username.trim() || typeof email !== 'string' || !email.includes('@') || typeof passwordHash !== 'string' || !passwordHash) {
          return res.status(400).json({ success: false, message: 'Invalid invitation registration.' });
        }
        const session = await mongoose.startSession();
        let user: any;
        try {
          await session.withTransaction(async () => {
            const invite = await AdminInvite.findOneAndUpdate({ invitationCode: invitationCode.trim().toUpperCase(), status: 'pending', expiresAt: { $gt: Date.now() } }, { $set: { status: 'accepted', acceptedAt: new Date() } }, { new: true, session });
            if (!invite) throw new Error('Invitation is expired or has already been used.');
            [user] = await Admin.create([{
              username: username.trim().toLowerCase(), email: email.trim().toLowerCase(),
              displayName: typeof displayName === 'string' && displayName.trim() ? displayName.trim() : username.trim(),
              passwordHash, recoveryPhrase: invite.recoveryPhrase, role: invite.role,
              permissions: invite.permissions, status: 'active', createdBy: invite.createdBy
            }], { session });
            await AdminInvite.updateOne({ _id: invite._id }, { $set: { acceptedBy: user._id } }, { session });
          });
          return res.status(200).json({ success: true, user });
        } finally { await session.endSession(); }
      }
      const invite = await AdminInvite.create(req.body);
      return res.status(200).json({ success: true, invite });
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.query;
      await AdminInvite.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: 'Invite revoked' });
    }
    
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
