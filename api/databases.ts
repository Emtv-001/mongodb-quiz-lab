import type { VercelRequest, VercelResponse } from '@vercel/node';
import databasesHandler from './admin/_databases.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return databasesHandler(req, res);
}
