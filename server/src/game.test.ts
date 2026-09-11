import { describe, it, expect } from 'vitest';
import { BOARD_SIZE } from '../../shared/src/index';
import {
  createRoom, startGame, endTurn, flipCard, makeGuess, requestRematch, viewFor, GameError, type Player, type Room,
} from './game';

function player(name: string): Player {
  return { id: name, token: name + '-tok', name, lastSeen: Date.now(), secretId: null, flipped: [], wantsRematch: false };
}

function twoPlayerRoom(): Room {
  const room = createRoom('ABCDEF', player('A'));
  room.players.push(player('B'));
  return room;
}

// deterministic rand: always 0 => first player active, no shuffle
const rand0 = () => 0;

describe('startGame', () => {
  it('deals a 25-card board with distinct secrets', () => {
    const room = twoPlayerRoom();
    startGame(room, 'A');
    expect(room.phase).toBe('playing');
    expect(room.board).toHaveLength(BOARD_SIZE);
    expect(new Set(room.board.map((c) => c.id)).size).toBe(BOARD_SIZE);
    const [a, b] = room.players;
    expect(a.secretId).not.toBeNull();
    expect(a.secretId).not.toBe(b.secretId);
    expect(room.board.some((c) => c.id === a.secretId)).toBe(true);
    expect(room.board.some((c) => c.id === b.secretId)).toBe(true);
  });

  it('rejects non-host and single player', () => {
    const room = twoPlayerRoom();
    expect(() => startGame(room, 'B')).toThrow(GameError);
    const solo = createRoom('X', player('A'));
    expect(() => startGame(solo, 'A')).toThrow(/two players/);
  });
});

describe('turns', () => {
  it('only the active player can end a turn, and ending passes it back and forth', () => {
    const room = twoPlayerRoom();
    startGame(room, 'A', rand0);
    expect(room.activePlayerId).toBe('A');
    expect(() => endTurn(room, 'B')).toThrow(/not your turn/);
    endTurn(room, 'A');
    expect(room.activePlayerId).toBe('B');
    expect(() => endTurn(room, 'A')).toThrow(/not your turn/);
    endTurn(room, 'B');
    expect(room.activePlayerId).toBe('A');
  });
});

describe('flip', () => {
  it('tracks flips per player and reports remaining', () => {
    const room = twoPlayerRoom();
    startGame(room, 'A', rand0);
    const id = room.board[3].id;
    flipCard(room, 'A', id, true);
    const viewA = viewFor(room, 'A');
    const viewB = viewFor(room, 'B');
    expect(viewA.myFlipped).toEqual([id]);
    expect(viewB.myFlipped).toEqual([]);
    expect(viewB.players.find((p) => p.id === 'A')!.remaining).toBe(BOARD_SIZE - 1);
    flipCard(room, 'A', id, false);
    expect(viewFor(room, 'A').myFlipped).toEqual([]);
  });
});

describe('guess', () => {
  it('correct guess wins', () => {
    const room = twoPlayerRoom();
    startGame(room, 'A', rand0);
    makeGuess(room, 'A', room.players[1].secretId!);
    expect(room.phase).toBe('finished');
    expect(room.finish!.winnerId).toBe('A');
    expect(room.finish!.reason).toBe('correct-guess');
  });

  it('wrong guess loses', () => {
    const room = twoPlayerRoom();
    startGame(room, 'A', rand0);
    const wrong = room.board.find((c) => c.id !== room.players[1].secretId)!.id;
    makeGuess(room, 'A', wrong);
    expect(room.finish!.winnerId).toBe('B');
    expect(room.finish!.reason).toBe('wrong-guess');
    expect(room.finish!.secrets.A).toBe(room.players[0].secretId);
  });

  it('only the active player can guess, and nothing can happen after the game ends', () => {
    const room = twoPlayerRoom();
    startGame(room, 'A', rand0);
    expect(() => makeGuess(room, 'B', room.board[0].id)).toThrow(/not your turn/);
    makeGuess(room, 'A', room.players[1].secretId!);
    expect(() => endTurn(room, 'B')).toThrow(/not in progress/);
  });
});

describe('rematch', () => {
  it('needs both players, then deals a fresh round', () => {
    const room = twoPlayerRoom();
    startGame(room, 'A', rand0);
    makeGuess(room, 'A', room.players[1].secretId!);
    requestRematch(room, 'A');
    expect(room.phase).toBe('finished');
    requestRematch(room, 'B');
    expect(room.phase).toBe('playing');
    expect(room.round).toBe(2);
    expect(room.players.every((p) => !p.wantsRematch)).toBe(true);
  });
});

describe('viewFor', () => {
  it('hides opponent secret', () => {
    const room = twoPlayerRoom();
    startGame(room, 'A', rand0);
    const v = viewFor(room, 'A');
    expect(v.mySecretId).toBe(room.players[0].secretId);
    expect(JSON.stringify(v.players)).not.toContain('secret');
    expect(v.finish).toBeNull();
  });
});
