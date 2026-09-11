import type { Action, JoinResponse, RoomView } from 'shared';

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(data.error ?? `Request failed (${res.status})`, res.status);
  return data as T;
}

export const api = {
  createRoom: (name: string) => request<JoinResponse>('POST', '/rooms', { name }),
  joinRoom: (code: string, name: string) => request<JoinResponse>('POST', `/rooms/${code}/join`, { name }),
  getState: (code: string, token: string) => request<RoomView>('GET', `/rooms/${code}?token=${encodeURIComponent(token)}`),
  act: (code: string, token: string, action: Action) => request<RoomView>('POST', `/rooms/${code}/action`, { token, ...action }),
};

export interface StoredSession {
  token: string;
  name: string;
}

const key = (code: string) => `sgw:session:${code}`;

export function saveSession(code: string, s: StoredSession) {
  try { localStorage.setItem(key(code), JSON.stringify(s)); } catch {}
}
export function loadSession(code: string): StoredSession | null {
  try {
    const raw = localStorage.getItem(key(code));
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch { return null; }
}
export function lastName(): string {
  try { return localStorage.getItem('sgw:name') ?? ''; } catch { return ''; }
}
export function rememberName(name: string) {
  try { localStorage.setItem('sgw:name', name); } catch {}
}
