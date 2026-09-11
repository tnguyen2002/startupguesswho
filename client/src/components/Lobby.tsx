import { useState } from 'react';
import type { RoomView } from 'shared';

interface Props {
  view: RoomView;
}

export default function Lobby({ view }: Props) {
  const ready = view.players.length === 2;
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(view.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="panel mx-auto w-full max-w-md p-6 rise sm:p-8">
      <p className="text-xs text-ink-3">Invite code</p>
      <div className="mt-1 flex items-center gap-3">
        <span className="display select-all font-mono text-5xl font-bold tracking-[0.18em] sm:text-6xl">{view.code}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? 'Copied' : 'Copy code'}
          title={copied ? 'Copied' : 'Copy code'}
          className="btn rounded-xl p-2.5"
        >
          {copied ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-mint"><path d="M20 6 9 17l-5-5" /></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
          )}
        </button>
      </div>

      <ul className="mt-8 space-y-2">
        {view.players.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
            <span className={`h-2 w-2 rounded-full ${p.connected ? 'bg-mint' : 'bg-ink-3'}`} />
            <span className="display font-semibold">{p.id === view.me ? 'You' : 'Opponent'}</span>
          </li>
        ))}
        {!ready && (
          <li className="flex items-center gap-3 rounded-xl border border-dashed border-line px-4 py-3 text-ink-3">
            <span className="h-2 w-2 animate-pulse rounded-full bg-coral" /> Waiting for a second player
          </li>
        )}
      </ul>

      <p className="mt-6 text-center text-xs text-ink-3">The game starts as soon as a second player joins.</p>
    </div>
  );
}
