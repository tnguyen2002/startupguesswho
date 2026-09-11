import type { RoomView } from 'shared';
import InviteBox from './InviteBox';

interface Props {
  view: RoomView;
  busy: boolean;
  onStart: () => void;
}

export default function Lobby({ view, busy, onStart }: Props) {
  const me = view.players.find((p) => p.id === view.me)!;
  const ready = view.players.length === 2;
  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
      <div className="rise">
        <InviteBox code={view.code} />
        <p className="mt-4 text-sm text-ink-2">
          Send the code or link to a friend. When they open it and enter their name, they'll appear here.
        </p>
      </div>
      <div className="panel p-5 rise" style={{ animationDelay: '80ms' }}>
        <p className="text-xs text-ink-3">Players</p>
        <ul className="mt-2 space-y-2">
          {view.players.map((p) => (
            <li key={p.id} className="flex items-center gap-3 border border-line bg-white px-3 py-2 rounded-xl">
              <span className={`h-2.5 w-2.5 rounded-full ${p.connected ? 'bg-mint' : 'bg-ink-3'}`} />
              <span className="display font-bold">{p.name}</span>
              {p.isHost && <span className="chip bg-mint-2 text-mint">host</span>}
              {p.id === view.me && <span className="text-xs text-ink-3">(you)</span>}
            </li>
          ))}
          {!ready && (
            <li className="flex items-center gap-3 border border-dashed border-line px-3 py-2 text-ink-3 rounded-xl">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-coral" /> waiting for a second player…
            </li>
          )}
        </ul>
        <div className="mt-5 space-y-1 text-sm text-ink-2">
          <p className="text-xs text-ink-3">How to play</p>
          <p>Both players see the same 24 startups. Each of you is secretly one of them.</p>
          <p>Take turns asking yes/no questions. You have 30 seconds to ask, or your turn passes. Flip cards down as you rule them out.</p>
          <p>Guess when you're sure. A wrong guess loses.</p>
          <p>Rooms close 15 minutes after everyone leaves.</p>
        </div>
        <div className="mt-5">
          {me.isHost ? (
            <button className="btn btn-primary w-full" disabled={!ready || busy} onClick={onStart}>
              {ready ? 'Start game' : 'Need 2 players'}
            </button>
          ) : (
            <p className="text-sm text-ink-2">Waiting for the host to start…</p>
          )}
        </div>
      </div>
    </div>
  );
}
