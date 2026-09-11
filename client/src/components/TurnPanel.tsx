import type { RoomView } from 'shared';

interface Props {
  view: RoomView;
  guessMode: boolean;
  busy: boolean;
  onEndTurn: () => Promise<void>;
  onToggleGuess: () => void;
}

/** Turn controls for a game played out loud: pass the turn, or guess. */
export default function TurnPanel({ view, guessMode, busy, onEndTurn, onToggleGuess }: Props) {
  const myTurn = view.activePlayerId === view.me;
  const opp = view.players.find((p) => p.id !== view.me);

  if (!myTurn) {
    return (
      <p className="text-sm text-ink-2">
        <b>{opp?.name}</b>'s turn. Answer their question out loud.
      </p>
    );
  }

  if (guessMode) {
    return (
      <div className="space-y-2">
        <p className="text-sm">
          <b className="text-coral">Guess mode.</b> Click a card to name it. A wrong guess loses.
        </p>
        <button className="btn btn-sm" onClick={onToggleGuess}>Cancel</button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-coral">Your turn</p>
      <p className="text-sm text-ink-2">Ask a yes or no question out loud, then end your turn.</p>
      <div className="flex gap-2">
        <button className="btn btn-ink flex-1" type="button" disabled={busy} onClick={() => onEndTurn().catch(() => {})}>
          End turn
        </button>
        <button className="btn btn-coral" type="button" onClick={onToggleGuess}>Guess</button>
      </div>
    </div>
  );
}
