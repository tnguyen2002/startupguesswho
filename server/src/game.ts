import {
  BOARD_SIZE,
  COMPANIES,
  COMPANY_BY_ID,
  MAX_QUESTION_LENGTH,
  type Answer,
  type Company,
  type FinishInfo,
  type LogEntry,
  type RoomPhase,
  type RoomView,
  type TurnStage,
} from '../../shared/src/index';

export interface Player {
  id: string;
  token: string;
  name: string;
  lastSeen: number;
  secretId: string | null;
  flipped: string[];
  wantsRematch: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  phase: RoomPhase;
  players: Player[]; // max 2, index 0 is host
  board: Company[];
  activePlayerId: string | null;
  stage: TurnStage | null;
  pendingQuestion: LogEntry | null;
  log: LogEntry[];
  finish: FinishInfo | null;
  round: number;
  nextLogId: number;
  lastActivity: number;
  version: number;
}

/** A player counts as connected if they polled within this window. */
export const PRESENCE_WINDOW_MS = 10_000;

export class GameError extends Error {}

function fail(msg: string): never {
  throw new GameError(msg);
}

export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function createRoom(code: string, host: Player): Room {
  return {
    code,
    hostId: host.id,
    phase: 'lobby',
    players: [host],
    board: [],
    activePlayerId: null,
    stage: null,
    pendingQuestion: null,
    log: [],
    finish: null,
    round: 0,
    nextLogId: 1,
    lastActivity: Date.now(),
    version: 0,
  };
}

export function getPlayer(room: Room, playerId: string): Player {
  return room.players.find((p) => p.id === playerId) ?? fail('Player not in room');
}

export function opponentOf(room: Room, playerId: string): Player {
  return room.players.find((p) => p.id !== playerId) ?? fail('No opponent yet');
}

function dealBoard(room: Room, rand: () => number) {
  const picked = shuffle(COMPANIES, rand).slice(0, BOARD_SIZE);
  room.board = picked;
  const secrets = shuffle(picked, rand);
  room.players.forEach((p, i) => {
    p.secretId = secrets[i].id;
    p.flipped = [];
    p.wantsRematch = false;
  });
  room.activePlayerId = room.players[Math.floor(rand() * room.players.length)].id;
  room.stage = 'asking';
  room.pendingQuestion = null;
  room.log = [];
  room.finish = null;
  room.phase = 'playing';
  room.round += 1;
}

export function startGame(room: Room, playerId: string, rand: () => number = Math.random) {
  if (room.phase !== 'lobby') fail('Game already started');
  if (playerId !== room.hostId) fail('Only the host can start');
  if (room.players.length !== 2) fail('Need two players to start');
  dealBoard(room, rand);
}

export function askQuestion(room: Room, playerId: string, text: string) {
  if (room.phase !== 'playing') fail('Game is not in progress');
  if (room.activePlayerId !== playerId) fail("It's not your turn");
  if (room.stage !== 'asking') fail('Waiting for an answer');
  const q = text.trim();
  if (!q) fail('Question cannot be empty');
  if (q.length > MAX_QUESTION_LENGTH) fail(`Question must be under ${MAX_QUESTION_LENGTH} characters`);
  room.pendingQuestion = { id: room.nextLogId++, askerId: playerId, question: q, answer: null, at: Date.now() };
  room.stage = 'answering';
}

export function answerQuestion(room: Room, playerId: string, answer: Answer) {
  if (room.phase !== 'playing') fail('Game is not in progress');
  if (room.stage !== 'answering' || !room.pendingQuestion) fail('No question to answer');
  if (room.activePlayerId === playerId) fail("You can't answer your own question");
  if (answer !== 'yes' && answer !== 'no') fail('Answer must be yes or no');
  room.log.push({ ...room.pendingQuestion, answer });
  room.pendingQuestion = null;
  room.activePlayerId = playerId; // answerer takes the next turn
  room.stage = 'asking';
}

export function flipCard(room: Room, playerId: string, companyId: string, down: boolean) {
  if (room.phase !== 'playing') fail('Game is not in progress');
  if (!room.board.some((c) => c.id === companyId)) fail('Card not on board');
  const p = getPlayer(room, playerId);
  const has = p.flipped.includes(companyId);
  if (down && !has) p.flipped.push(companyId);
  if (!down && has) p.flipped = p.flipped.filter((id) => id !== companyId);
}

export function makeGuess(room: Room, playerId: string, companyId: string) {
  if (room.phase !== 'playing') fail('Game is not in progress');
  if (room.activePlayerId !== playerId) fail("It's not your turn");
  if (room.stage !== 'asking') fail('Waiting for an answer');
  if (!room.board.some((c) => c.id === companyId)) fail('Card not on board');
  const opp = opponentOf(room, playerId);
  const correct = opp.secretId === companyId;
  const secrets: Record<string, string> = {};
  for (const p of room.players) secrets[p.id] = p.secretId!;
  room.finish = {
    winnerId: correct ? playerId : opp.id,
    loserId: correct ? opp.id : playerId,
    reason: correct ? 'correct-guess' : 'wrong-guess',
    guessedCompanyId: companyId,
    secrets,
  };
  room.phase = 'finished';
  room.stage = null;
  room.pendingQuestion = null;
}

export function requestRematch(room: Room, playerId: string, rand: () => number = Math.random) {
  if (room.phase !== 'finished') fail('Game is not finished');
  getPlayer(room, playerId).wantsRematch = true;
  if (room.players.length === 2 && room.players.every((p) => p.wantsRematch)) {
    dealBoard(room, rand);
  }
}

export function viewFor(room: Room, playerId: string, now: number = Date.now()): RoomView {
  const me = getPlayer(room, playerId);
  return {
    code: room.code,
    phase: room.phase,
    me: playerId,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      connected: now - p.lastSeen < PRESENCE_WINDOW_MS,
      isHost: p.id === room.hostId,
      remaining: room.board.length ? room.board.length - p.flipped.length : 0,
      wantsRematch: p.wantsRematch,
    })),
    board: room.board,
    mySecretId: me.secretId,
    myFlipped: me.flipped,
    activePlayerId: room.activePlayerId,
    stage: room.stage,
    pendingQuestion: room.pendingQuestion,
    log: room.log,
    finish: room.finish,
    round: room.round,
    version: room.version,
  };
}

export { COMPANY_BY_ID };
