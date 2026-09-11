import { randomBytes, randomUUID } from 'node:crypto';
import { generateRoomCode, MAX_NAME_LENGTH, normalizeRoomCode, type Action, type JoinResponse, type RoomView } from '../../shared/src/index';
import {
  answerQuestion, askQuestion, createRoom, expireTurn, flipCard, GameError, makeGuess, requestRematch, startGame, startTimer, viewFor,
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
  await update(store, code, (room) => {
    if (room.players.length >= 2) throw new GameError('Room is full');
    room.players.push(player);
    // Two players is a game: deal immediately, no lobby start button.
    if (room.phase === 'lobby') startGame(room, room.hostId);
  });
  return { code, token: player.token, playerId: player.id };
}

/** Polled by clients. Also refreshes the caller's presence. */
export async function getStateHandler(store: RoomStore, rawCode: string, token: unknown): Promise<RoomView> {
  const code = normalizeRoomCode(rawCode);
  const room = await store.get(code);
  if (!room) throw new NotFoundError('Room not found or expired');
  const me = playerByToken(room, token);
  const now = Date.now();
  // Write only when needed: presence heartbeat every few seconds, or an expired ask timer.
  const timerExpired = room.turnDeadline !== null && room.stage === 'asking' && now >= room.turnDeadline;
  if (timerExpired || now - me.lastSeen > 3000) {
    const updated = await update(store, code, (r) => {
      playerByToken(r, token).lastSeen = Date.now();
      expireTurn(r);
    }).catch(() => room);
    return viewFor(updated, me.id);
  }
  return viewFor(room, me.id);
}

export async function actionHandler(store: RoomStore, rawCode: string, token: unknown, action: Action): Promise<RoomView> {
  const code = normalizeRoomCode(rawCode);
  let playerId = '';
  const room = await update(store, code, (room) => {
    const me = playerByToken(room, token);
    me.lastSeen = Date.now();
    playerId = me.id;
    expireTurn(room); // a late action after the timer ran out is judged against the passed turn
    switch (action?.type) {
      case 'start': return startGame(room, me.id);
      case 'timer': return startTimer(room, me.id);
      case 'rename': { me.name = cleanName(action.name, me.name); return; }
      case 'ask': return askQuestion(room, me.id, String(action.text ?? ''));
      case 'answer': return answerQuestion(room, me.id, action.answer);
      case 'flip': return flipCard(room, me.id, String(action.companyId), Boolean(action.down));
      case 'guess': return makeGuess(room, me.id, String(action.companyId));
      case 'rematch': return requestRematch(room, me.id);
      default: throw new GameError('Unknown action');
    }
  });
  return viewFor(room, playerId);
}
