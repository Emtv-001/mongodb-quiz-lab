import type { VercelRequest, VercelResponse } from '@vercel/node';
import Admin from '../_models/Admin.js';
import Learner from '../_models/Learner.js';
import SiteEvent from '../_models/SiteEvent.js';
import connectToDatabase from '../_utils/db.js';
import { clearAnalyticsSession, readAnalyticsSession } from '../_utils/analyticsSession.js';

const shareMethods = new Set(['copy', 'whatsapp', 'x', 'device']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.headers['sec-fetch-site'] === 'cross-site') return res.status(403).end();

  if (req.method === 'DELETE') {
    clearAnalyticsSession(res);
    return res.status(204).end();
  }

  try {
    if (req.method === 'POST') {
      const { id, kind, referral, method } = req.body ?? {};
      if (typeof id !== 'string' || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(id) ||
          (kind !== 'visit' && kind !== 'share') ||
          (kind === 'share' && !shareMethods.has(method)) ||
          (referral !== undefined && (typeof referral !== 'string' || referral.length > 80))) {
        return res.status(400).json({ message: 'Invalid analytics event.' });
      }

      await connectToDatabase();
      const code = referral?.trim().toUpperCase();
      const learner = kind === 'visit' && code && /^[A-Z0-9_-]+$/.test(code)
        ? await Learner.findOne({ referralCode: code }).select('referralCode').lean()
        : null;
      const channel = kind === 'share' ? method : learner ? 'referral' : code ? 'unknown-referral' : 'non-referral';
      try {
        await SiteEvent.create({ _id: id, kind, channel, referralCode: learner ? code : undefined, createdAt: new Date() });
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
      }
      return res.status(204).end();
    }

    if (req.method !== 'GET') return res.status(405).end();
    const session = readAnalyticsSession(req);
    if (!session) return res.status(401).json({ message: 'Sign out and sign in online to view site analytics.' });

    await connectToDatabase();
    const admin = await Admin.findById(session.id).select('passwordHash role status permissions').lean();
    if (!admin || (admin.status && admin.status !== 'active') || !session.authenticates(admin.passwordHash)) {
      return res.status(401).json({ message: 'Sign out and sign in online to view site analytics.' });
    }
    if (!['super-admin', 'super_admin'].includes(admin.role) && admin.permissions?.canViewLearnerData !== true) {
      return res.status(403).json({ message: 'Your admin account does not have permission to view site analytics.' });
    }

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [result] = await SiteEvent.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $facet: {
        counts: [{ $group: { _id: { kind: '$kind', channel: '$channel' }, count: { $sum: 1 } } }],
        leaders: [
          { $match: { kind: 'visit', channel: 'referral' } },
          { $group: { _id: '$referralCode', visits: { $sum: 1 } } },
          { $sort: { visits: -1, _id: 1 } },
          { $limit: 5 }
        ]
      } }
    ]);
    const leaders: { _id: string; visits: number }[] = result.leaders;
    const learners = await Learner.find({ referralCode: { $in: leaders.map(row => row._id) } })
      .select('username referralCode').lean();
    const names = new Map(learners.map(learner => [learner.referralCode, learner.username]));
    return res.status(200).json({
      counts: result.counts,
      leaders: leaders.map(row => ({ code: row._id, visits: row.visits, username: names.get(row._id) }))
    });
  } catch {
    return res.status(500).json({ message: 'Site analytics is temporarily unavailable.' });
  }
}
