import { describe, it, expect } from 'vitest';
import { BOARD_SIZE, TURN_SECONDS } from '../../shared/src/index';
import {
  createRoom, startGame, askQuestion, answerQuestion, flipCard, makeGuess, requestRematch, viewFor, expireTurn, GameError, type Player, type Room,
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
  it('deals a 24-card board with distinct secrets', () => {
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
    expect(room.stage).toBe('asking');
  });

  it('rejects non-host and single player', () => {
    const room = twoPlayerRoom();
    expect(() => startGame(room, 'B')).toThrow(GameError);
    const solo = createRoom('X', player('A'));
    expect(() => startGame(solo, 'A')).toThrow(/two players/);
  });
});

describe('turns', () => {
  it('alternates ask/answer and rejects out-of-turn actions', () => {
    const room = twoPlayerRoom();
    startGame(room, 'A', rand0);
    expect(room.activePlayerId).toBe('A');
    expect(() => askQuestion(room, 'B', 'Is it fintech?')).toThrow(/not your turn/);
    askQuestion(room, 'A', 'Is it fintech?');
    expect(room.stage).toBe('answering');
    expect(() => askQuestion(room, 'A', 'again?')).toThrow(/Waiting/);
    expect(() => answerQuestion(room, 'A', 'yes')).toThrow(/own question/);
    answerQuestion(room, 'B', 'no');
    expect(room.log).toHaveLength(1);
    expect(room.log[0].answer).toBe('no');
    expect(room.activePlayerId).toBe('B');
    expect(room.stage).toBe('asking');
  });

  it('rejects empty questions', () => {
    const room = twoPlayerRoom();
    startGame(room, 'A', rand0);
    expect(() => askQuestion(room, 'A', '   ')).toThrow(/empty/);
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

  it('cannot guess while waiting for an answer', () => {
    const room = twoPlayerRoom();
    startGame(room, 'A', rand0);
    askQuestion(room, 'A', 'q?');
    expect(() => makeGuess(room, 'A', room.board[0].id)).toThrow(/Waiting/);
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
    expect(room.log).toEqual([]);
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

describe('turn timer', () => {
  it('sets a deadline when a turn starts and clears it while answering', () => {
    const room = twoPlayerRoom();
    startGame(room, 'A', rand0);
    expect(room.turnDeadline).toBeGreaterThan(Date.now() + (TURN_SECONDS - 2) * 1000);
    askQuestion(room, 'A', 'q?');
    expect(room.turnDeadline).toBeNull();
    answerQuestion(room, 'B', 'yes');
    expect(room.turnDeadline).not.toBeNull();
  });

  it('passes the turn when the deadline is missed, and not before', () => {
    const room = twoPlayerRoom();
    startGame(room, 'A', rand0);
    const deadline = room.turnDeadline!;
    expect(expireTurn(room, deadline - 1)).toBe(false);
    expect(room.activePlayerId).toBe('A');
    expect(expireTurn(room, deadline)).toBe(true);
    expect(room.activePlayerId).toBe('B');
    expect(room.turnDeadline).toBe(deadline + TURN_SECONDS * 1000);
    expect(() => askQuestion(room, 'A', 'too late?')).toThrow(/not your turn/);
  });

  it('does nothing while a question is pending or after the game ends', () => {
    const room = twoPlayerRoom();
    startGame(room, 'A', rand0);
    askQuestion(room, 'A', 'q?');
    expect(expireTurn(room, Date.now() + 10 * 60 * 1000)).toBe(false);
    answerQuestion(room, 'B', 'no');
    makeGuess(room, 'B', room.players[0].secretId!);
    expect(expireTurn(room, Date.now() + 10 * 60 * 1000)).toBe(false);
  });
});
