import { useState } from 'react';
import { MAX_QUESTION_LENGTH, type RoomView } from 'shared';
import Countdown from './Countdown';

const hasPointer = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

interface Props {
  view: RoomView;
  receivedAt: number;
  guessMode: boolean;
  busy: boolean;
  onAsk: (text: string) => Promise<void>;
  onAnswer: (a: 'yes' | 'no') => Promise<void>;
  onToggleGuess: () => void;
  onExpire: () => void;
}

/** The single ask/answer exchange plus the turn timer. Replaces the old question log. */
export default function TurnPanel({ view, receivedAt, guessMode, busy, onAsk, onAnswer, onToggleGuess, onExpire }: Props) {
  const [text, setText] = useState('');
  const myTurn = view.activePlayerId === view.me;
  const opp = view.players.find((p) => p.id !== view.me);
  const last = view.log.length ? view.log[view.log.length - 1] : null;

  const lastExchange = last && (
    <div className="mb-3 rounded-xl bg-paper px-3 py-2 text-sm">
      <span className="text-ink-3">{last.askerId === view.me ? 'You asked' : `${opp?.name} asked`}: </span>
      <span>{last.question}</span>{' '}
      <span className={`chip ${last.answer === 'yes' ? 'bg-mint-2 text-mint' : 'bg-coral-2 text-coral'}`}>{last.answer}</span>
    </div>
  );

  const timer = (
    <Countdown deadline={view.turnDeadline} serverNow={view.serverNow} receivedAt={receivedAt} onExpire={onExpire} />
  );

  if (view.stage === 'answering') {
    if (myTurn) {
      return (
        <div>
          {lastExchange}
          <p className="text-xs text-ink-3">You asked</p>
          <p className="display mt-1 text-base font-bold leading-snug">{view.pendingQuestion?.question}</p>
          <p className="mt-2 text-sm text-ink-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-coral align-middle" /> Waiting for{' '}
            <b>{opp?.name}</b> to answer…
          </p>
        </div>
      );
    }
    return (
      <div>
        {lastExchange}
        <p className="text-xs text-ink-3">{opp?.name} asks about your secret</p>
        <p className="display mb-3 mt-1 text-base font-bold leading-snug">{view.pendingQuestion?.question}</p>
        <div className="grid grid-cols-2 gap-3">
          <button className="btn btn-yes" disabled={busy} onClick={() => onAnswer('yes')}>Yes</button>
          <button className="btn btn-coral" disabled={busy} onClick={() => onAnswer('no')}>No</button>
        </div>
      </div>
    );
  }

  if (!myTurn) {
    return (
      <div>
        {lastExchange}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink-2">
            <b>{opp?.name}</b> is thinking of a question…
          </p>
          {timer}
        </div>
      </div>
    );
  }

  if (guessMode) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm">
            <b className="text-coral">Guess mode.</b> Click a card to name it. A wrong guess loses.
          </p>
          {timer}
        </div>
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
      {lastExchange}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-coral">Your turn</p>
        {timer}
      </div>
      <input
        className="field"
        placeholder="Ask a yes/no question…"
        value={text}
        maxLength={MAX_QUESTION_LENGTH}
        autoFocus={hasPointer}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex gap-2">
        <button className="btn btn-ink flex-1" type="submit" disabled={busy || !text.trim()}>Ask</button>
        <button className="btn btn-coral" type="button" onClick={onToggleGuess}>Guess</button>
      </div>
    </form>
  );
}
