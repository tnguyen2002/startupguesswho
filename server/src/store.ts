import type { Room } from './game';

export const ROOM_TTL_SECONDS = 2 * 60 * 60; // 2 hours idle

export interface RoomStore {
  get(code: string): Promise<Room | null>;
  /** Write only if the stored version equals `expectedVersion` (0 = must not exist). Returns false on conflict. */
  compareAndSet(code: string, room: Room, expectedVersion: number): Promise<boolean>;
}

export class MemoryStore implements RoomStore {
  private rooms = new Map<string, { room: Room; expires: number }>();

  async get(code: string): Promise<Room | null> {
    const entry = this.rooms.get(code);
    if (!entry) return null;
    if (entry.expires < Date.now()) { this.rooms.delete(code); return null; }
    return structuredClone(entry.room);
  }

  async compareAndSet(code: string, room: Room, expectedVersion: number): Promise<boolean> {
    const current = await this.get(code);
    const currentVersion = current?.version ?? 0;
    if (currentVersion !== expectedVersion) return false;
    this.rooms.set(code, { room: structuredClone(room), expires: Date.now() + ROOM_TTL_SECONDS * 1000 });
    return true;
  }
}

// Lua script: atomically set the room JSON only if the stored version matches.
const CAS_SCRIPT = `
local cur = redis.call('GET', KEYS[1])
local curVersion = 0
if cur then curVersion = cjson.decode(cur).version end
if tostring(curVersion) ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
return 1
`;

interface UpstashLike {
  get<T>(key: string): Promise<T | null>;
  eval<T>(script: string, keys: string[], args: (string | number)[]): Promise<T>;
}

export class RedisStore implements RoomStore {
  constructor(private redis: UpstashLike) {}

  private key(code: string) { return `sgw:room:${code}`; }

  async get(code: string): Promise<Room | null> {
    const raw = await this.redis.get<Room | string>(this.key(code));
    if (raw == null) return null;
    return typeof raw === 'string' ? (JSON.parse(raw) as Room) : raw;
  }

  async compareAndSet(code: string, room: Room, expectedVersion: number): Promise<boolean> {
    const result = await this.redis.eval<number>(CAS_SCRIPT, [this.key(code)], [
      String(expectedVersion),
      JSON.stringify(room),
      ROOM_TTL_SECONDS,
    ]);
    return Number(result) === 1;
  }
}

let cached: RoomStore | null = null;

/** Upstash Redis when credentials are present (Vercel Marketplace sets them), otherwise in-memory. */
export async function getStore(): Promise<RoomStore> {
  if (cached) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) {
    const { Redis } = await import('@upstash/redis');
    cached = new RedisStore(new Redis({ url, token, automaticDeserialization: false }));
  } else {
    if (process.env.VERCEL) console.warn('No Upstash Redis credentials found; rooms will not persist across function instances.');
    cached = new MemoryStore();
  }
  return cached;
}
