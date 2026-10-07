import type { VercelRequest, VercelResponse } from '@vercel/node';
import adminsHandler from './_admins.js';
import invitesHandler from './_invites.js';
import logsHandler from './_logs.js';
import statementsHandler from './_statements.js';
import usersHandler from './_users.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;
  
  if (action === 'admins') return adminsHandler(req, res);
  if (action === 'invites') return invitesHandler(req, res);
  if (action === 'logs') return logsHandler(req, res);
  if (action === 'statements') return statementsHandler(req, res);
  if (action === 'users') return usersHandler(req, res);

  return res.status(404).json({ success: false, message: 'Route not found' });
}
