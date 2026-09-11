// Framework-agnostic router shared by the Vercel function and the local dev server.
import { GameError } from './game';
import { actionHandler, createRoomHandler, getStateHandler, joinRoomHandler, NotFoundError } from './api';
import { getStore } from './store';

export interface HttpRequest {
  method: string;
  /** Path relative to /api, e.g. "/rooms/ABC123/action" */
  path: string;
  query: Record<string, string | undefined>;
  body: unknown;
}

export interface HttpResponse {
  status: number;
  body: unknown;
}

const json = (status: number, body: unknown): HttpResponse => ({ status, body });

export async function handle(req: HttpRequest): Promise<HttpResponse> {
  try {
    const store = await getStore();
    const body = (req.body ?? {}) as Record<string, unknown>;
    const parts = req.path.replace(/^\/+|\/+$/g, '').split('/');

    if (parts[0] === 'health') return json(200, { ok: true });

    if (parts[0] === 'rooms') {
      if (parts.length === 1 && req.method === 'POST') {
        return json(201, await createRoomHandler(store, body.name));
      }
      const code = parts[1];
      if (code && parts.length === 2 && req.method === 'GET') {
        return json(200, await getStateHandler(store, code, req.query.token));
      }
      if (code && parts[2] === 'join' && req.method === 'POST') {
        return json(200, await joinRoomHandler(store, code, body.name));
      }
      if (code && parts[2] === 'action' && req.method === 'POST') {
        const { token, ...action } = body;
        return json(200, await actionHandler(store, code, token, action as never));
      }
    }
    return json(404, { error: 'Not found' });
  } catch (e) {
    if (e instanceof NotFoundError) return json(404, { error: e.message });
    if (e instanceof GameError) return json(400, { error: e.message });
    console.error(e);
    return json(500, { error: 'Something went wrong' });
  }
}
