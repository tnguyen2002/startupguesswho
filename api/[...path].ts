import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handle } from '../server/src/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = url.pathname.replace(/^\/api/, '') || '/';
  const query: Record<string, string | undefined> = {};
  url.searchParams.forEach((v, k) => { query[k] = v; });
  const out = await handle({ method: req.method ?? 'GET', path, query, body: req.body });
  res.setHeader('Cache-Control', 'no-store');
  res.status(out.status).json(out.body);
}
