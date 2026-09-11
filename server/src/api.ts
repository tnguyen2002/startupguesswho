import { randomBytes, randomUUID } from 'node:crypto';
import { generateRoomCode, MAX_NAME_LENGTH, normalizeRoomCode, type Action, type JoinResponse, type RoomView } from '../../shared/src/index';
import {
  createRoom, endTurn, flipCard, GameError, makeGuess, requestRematch, startGame, viewFor,
  type Player, type Room,
} from './game';
import type { RoomStore } from './store';

export class NotFoundError extends Error {}

function cleanName(name: unknown, fallback: string): string {
  const n = String(name ?? '').trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH);
  return n || fallback;
}

function newPlayer(name: unknown, fallback: string): Player {
  return {
    id: randomUUID(),
    token: randomBytes(16).toString('hex'),
    name: cleanName(name, fallback),
    lastSeen: Date.now(),
    secretId: null,
    flipped: [],
    wantsRematch: false,
  };
}

const MAX_RETRIES = 5;

/** Read-modify-write with optimistic concurrency. `mutate` runs against a fresh copy on each retry. */
async function update(store: RoomStore, code: string, mutate: (room: Room) => void): Promise<Room> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const room = await store.get(code);
    if (!room) throw new NotFoundError('Room not found or expired');
    const expected = room.version;
    mutate(room);
    room.version = expected + 1;
    room.lastActivity = Date.now();
    if (await store.compareAndSet(code, room, expected)) return room;
  }
  throw new GameError('Room is busy, try again');
}

function playerByToken(room: Room, token: unknown): Player {
  const p = room.players.find((p) => p.token === String(token ?? ''));
  if (!p) throw new GameError('You are not a member of this room');
  return p;
}

export async function createRoomHandler(store: RoomStore, name: unknown): Promise<JoinResponse> {
  const player = newPlayer(name, 'Player 1');
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code = generateRoomCode();
    const room = createRoom(code, player);
    room.version = 1;
    if (await store.compareAndSet(code, room, 0)) return { code, token: player.token, playerId: player.id };
  }
  throw new GameError('Could not allocate a room code');
}

export async function joinRoomHandler(store: RoomStore, rawCode: string, name: unknown): Promise<JoinResponse> {
  const code = normalizeRoomCode(rawCode);
  const player = newPlayer(name, 'Player 2');
  let dealt = false;
  await update(store, code, (room) => {
    if (room.players.length >= 2) throw new GameError('Room is full');
    room.players.push(player);
    // Two players is a game: deal immediately, no lobby start button.
    if (room.phase === 'lobby') { startGame(room, room.hostId); dealt = true; }
  });
  if (dealt) await store.countGame().catch(() => {});
  return { code, token: player.token, playerId: player.id };
}

/** Polled by clients. Also refreshes the caller's presence. */
export async function getStateHandler(store: RoomStore, rawCode: string, token: unknown): Promise<RoomView> {
  const code = normalizeRoomCode(rawCode);
  const room = await store.get(code);
  if (!room) throw new NotFoundError('Room not found or expired');
  const me = playerByToken(room, token);
  // Presence heartbeat: only write when it's been a while, to avoid a CAS storm from polling.
  if (Date.now() - me.lastSeen > 3000) {
    const updated = await update(store, code, (r) => { playerByToken(r, token).lastSeen = Date.now(); }).catch(() => room);
    return viewFor(updated, me.id);
  }
  return viewFor(room, me.id);
}

export async function actionHandler(store: RoomStore, rawCode: string, token: unknown, action: Action): Promise<RoomView> {
  const code = normalizeRoomCode(rawCode);
  let playerId = '';
  let rematchDealt = false;
  const room = await update(store, code, (room) => {
    const me = playerByToken(room, token);
    me.lastSeen = Date.now();
    playerId = me.id;
    switch (action?.type) {
      case 'start': return startGame(room, me.id);
      case 'rename': { me.name = cleanName(action.name, me.name); return; }
      case 'end': return endTurn(room, me.id);
      case 'flip': return flipCard(room, me.id, String(action.companyId), Boolean(action.down));
      case 'guess': return makeGuess(room, me.id, String(action.companyId));
      case 'rematch': {
        const before = room.round;
        requestRematch(room, me.id);
        rematchDealt = room.round > before;
        return;
      }
      default: throw new GameError('Unknown action');
    }
  });
  if (rematchDealt) await store.countGame().catch(() => {});
  return viewFor(room, playerId);
}

export async function statsHandler(store: RoomStore): Promise<{ games: number }> {
  return { games: await store.gamesPlayed() };
}
