import { useState } from 'react';
import { MAX_QUESTION_LENGTH, type RoomView } from 'shared';

interface Props {
  view: RoomView;
  guessMode: boolean;
  busy: boolean;
  onAsk: (text: string) => Promise<void>;
  onAnswer: (a: 'yes' | 'no') => Promise<void>;
  onToggleGuess: () => void;
}

export default function TurnPanel({ view, guessMode, busy, onAsk, onAnswer, onToggleGuess }: Props) {
  const [text, setText] = useState('');
  const myTurn = view.activePlayerId === view.me;
  const opp = view.players.find((p) => p.id !== view.me);

  if (view.stage === 'answering') {
    if (myTurn) {
      return (
        <div className="text-sm text-ink-2">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-coral align-middle" /> Waiting for{' '}
          <b>{opp?.name}</b> to answer…
        </div>
      );
    }
    return (
      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-ink-3">Answer about your secret company</p>
        <div className="grid grid-cols-2 gap-3">
          <button className="btn btn-lime" disabled={busy} onClick={() => onAnswer('yes')}>Yes</button>
          <button className="btn btn-primary" disabled={busy} onClick={() => onAnswer('no')}>No</button>
        </div>
      </div>
    );
  }

  if (!myTurn) {
    return (
      <div className="text-sm text-ink-2">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-ink align-middle" /> <b>{opp?.name}</b> is
        thinking of a question…
      </div>
    );
  }

  if (guessMode) {
    return (
      <div className="space-y-2">
        <p className="text-sm">
          <b className="text-coral">Guess mode.</b> Click a card on the board to name it. A wrong guess loses the game.
        </p>
        <button className="btn btn-sm" onClick={onToggleGuess}>Cancel guess</button>
      </div>
    );
  }

  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        await onAsk(text);
        setText('');
      }}
    >
      <p className="text-xs uppercase tracking-wider text-coral">Your turn</p>
      <input
        className="field"
        placeholder="Ask a yes/no question…"
        value={text}
        maxLength={MAX_QUESTION_LENGTH}
        autoFocus
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex gap-2">
        <button className="btn btn-ink flex-1" type="submit" disabled={busy || !text.trim()}>Ask</button>
        <button className="btn btn-primary" type="button" onClick={onToggleGuess}>Guess</button>
      </div>
    </form>
  );
}
