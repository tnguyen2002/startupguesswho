import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handle } from '../server/src/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const segments = req.query.path;
  const path = '/' + (Array.isArray(segments) ? segments.join('/') : segments ?? '');
  const { path: _p, ...query } = req.query as Record<string, string | string[] | undefined>;
  const flat: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(query)) flat[k] = Array.isArray(v) ? v[0] : v;
  const out = await handle({ method: req.method ?? 'GET', path, query: flat, body: req.body });
  res.setHeader('Cache-Control', 'no-store');
  res.status(out.status).json(out.body);
}
