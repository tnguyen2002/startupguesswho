import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { COMPANY_BY_ID, normalizeRoomCode, type Company, type RoomView } from 'shared';
import { useRoom } from '../hooks/useRoom';
import Lobby from '../components/Lobby';
import Board from '../components/Board';
import TurnPanel from '../components/TurnPanel';
import GuessModal from '../components/GuessModal';
import ResultScreen from '../components/ResultScreen';
import Logo from '../components/Logo';

export default function Room() {
  const { code: raw = '' } = useParams();
  const code = normalizeRoomCode(raw);
  const { view, status, error, toast, busy, joinWithName, act } = useRoom(code);

  return (
    <main className="min-h-dvh px-4 py-3 sm:px-6 lg:py-5">
      <nav className="mx-auto mb-3 flex max-w-7xl items-center justify-between gap-3 lg:mb-5">
        <Link to="/" className="display whitespace-nowrap text-base font-bold sm:text-lg">
          Startup 🦄 Guess Who
        </Link>
        {view && view.phase !== 'lobby' && (
          <span className="display rounded-full border border-line bg-white px-3 py-1 text-xs font-bold tracking-[0.15em] lg:hidden">
            {view.code}
          </span>
        )}
      </nav>

      {status === 'connecting' && <p className="text-center text-ink-3">Connecting…</p>}
      {status === 'error' && (
        <div className="mx-auto max-w-md panel p-6 text-center">
          <p className="display text-xl font-bold">Couldn't open this room</p>
          <p className="mt-2 text-sm text-ink-2">{error}</p>
          <Link to="/" className="btn mt-5">Back home</Link>
        </div>
      )}
      {status === 'need-name' && <AutoJoin busy={busy} error={error} onJoin={joinWithName} />}
      {status === 'joined' && view && (
        <>
          {view.phase === 'lobby' && <Lobby view={view} />}
          {view.phase !== 'lobby' && <Game view={view} busy={busy} act={act} />}
        </>
      )}

      {toast && (
        <div className="display fixed bottom-5 left-1/2 z-50 -translate-x-1/2 border border-line bg-coral px-4 py-2 text-sm font-bold text-white rise rounded-xl">
          {toast}
        </div>
      )}
    </main>
  );
}

function AutoJoin({ busy, error, onJoin }: { busy: boolean; error: string | null; onJoin: (n: string) => void }) {
  // Opening an invite link joins immediately; the player can set a name once inside.
  useEffect(() => { if (!busy && !error) onJoin(''); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (error) {
    return (
      <div className="mx-auto max-w-md panel p-6 text-center">
        <p className="display text-xl font-bold">Couldn't join this room</p>
        <p className="mt-2 text-sm text-ink-2">{error}</p>
        <Link to="/" className="btn mt-5">Back home</Link>
      </div>
    );
  }
  return <p className="text-center text-ink-3">Joining…</p>;
}

type Act = ReturnType<typeof useRoom>['act'];

function Game({ view, busy, act }: { view: RoomView; busy: boolean; act: Act }) {
  const nav = useNavigate();
  const [guessMode, setGuessMode] = useState(false);
  const [guessing, setGuessing] = useState<Company | null>(null);
  // Optimistic flips: update locally on click, then let the server's next snapshot confirm.
  const [flipped, setFlipped] = useState<Set<string>>(() => new Set(view.myFlipped));
  useEffect(() => { setFlipped(new Set(view.myFlipped)); }, [view.myFlipped]);
  const me = view.players.find((p) => p.id === view.me)!;
  const opp = view.players.find((p) => p.id !== view.me);
  const secret = view.mySecretId ? COMPANY_BY_ID[view.mySecretId] : null;
  const myTurn = view.activePlayerId === view.me;
  const finished = view.phase === 'finished';

  const swallow = (p: Promise<unknown>) => p.catch(() => {});

  return (
    <div className="mx-auto grid max-w-6xl gap-4 pb-36 lg:grid-cols-[300px_1fr] lg:gap-8 lg:pb-0">
      {/* Desktop sidebar: secret, players, turn controls */}
      <aside className="panel hidden self-start p-5 lg:sticky lg:top-5 lg:block">
        {secret && (
          <div className="flex items-center gap-3">
            <Logo company={secret} size={48} />
            <div className="min-w-0">
              <p className="text-xs text-ink-3">Your secret</p>
              <p className="display truncate text-lg font-bold leading-tight">{secret.name}</p>
            </div>
          </div>
        )}

        <ul className="mt-5 space-y-2 text-sm">
          {view.players.map((p) => {
            const active = view.activePlayerId === p.id && !finished;
            return (
              <li key={p.id} className={`flex items-center justify-between rounded-xl border px-3 py-2 ${active ? 'border-coral bg-coral-2' : 'border-line'}`}>
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${p.connected ? 'bg-mint' : 'bg-ink-3'} ${active ? 'pulse' : ''}`} />
                  <b className="display">{p.id === view.me ? 'You' : 'Opponent'}</b>
                </span>
              </li>
            );
          })}
        </ul>
        {opp && !opp.connected && <p className="mt-2 text-xs text-coral">Your opponent disconnected. They can rejoin with the same code.</p>}

        {!finished && (
          <div className="mt-5 border-t border-line pt-5">
            <TurnPanel
              view={view}
              guessMode={guessMode}
              busy={busy}
              onEndTurn={() => act({ type: 'end' })}
              onToggleGuess={() => setGuessMode((g) => !g)}
            />
          </div>
        )}
        <div className="mt-5 flex justify-end">
          <span className="display rounded-full border border-line bg-white px-2.5 py-1 text-xs font-bold tracking-[0.15em]">{view.code}</span>
        </div>
      </aside>

      {/* Mobile: compact sticky header */}
      <div className="sticky top-0 z-30 -mx-4 border-b border-line bg-paper px-4 py-2 lg:hidden" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-3">
          {secret && (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Logo company={secret} size={36} />
              <div className="min-w-0 leading-tight">
                <div className="text-[10px] text-ink-3">Your secret</div>
                <div className="display truncate text-sm font-bold">{secret.name}</div>
              </div>
            </div>
          )}
          <div className="ml-auto flex shrink-0 items-center gap-1.5 text-xs">
            {view.players.map((p) => {
              const active = view.activePlayerId === p.id && !finished;
              return (
                <span key={p.id} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 leading-none ${active ? 'border-coral bg-coral-2' : 'border-line bg-white'}`}>
                  <span className={`h-2 w-2 rounded-full ${p.connected ? 'bg-mint' : 'bg-ink-3'} ${active ? 'pulse' : ''}`} />
                  <b className="display">{p.id === view.me ? 'You' : 'Opponent'}</b>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Center: board */}
      <section className="mx-auto w-full max-w-[760px] lg:self-start">
        {finished && view.finish && <ResultScreen view={view} busy={busy} onRematch={() => swallow(act({ type: 'rematch' }))} onHome={() => nav('/')} />}
        <div className={finished ? 'pointer-events-none opacity-70' : ''}>
          <Board
            board={view.board}
            flipped={flipped}
            mode={guessMode && myTurn ? 'guess' : 'flip'}
            mySecretId={view.mySecretId}
            onFlip={(id, down) => {
              setFlipped((prev) => { const next = new Set(prev); if (down) next.add(id); else next.delete(id); return next; });
              swallow(act({ type: 'flip', companyId: id, down }));
            }}
            onGuess={(c) => setGuessing(c)}
          />
        </div>
      </section>

      {/* Mobile: turn controls pinned to the bottom of the screen */}
      {!finished && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white px-4 pt-3 lg:hidden"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))', boxShadow: '0 -4px 16px rgba(0,0,0,0.06)' }}
        >
          <TurnPanel
            view={view}
            guessMode={guessMode}
            busy={busy}
            onEndTurn={() => act({ type: 'end' })}
            onToggleGuess={() => setGuessMode((g) => !g)}
          />
        </div>
      )}

      {guessing && (
        <GuessModal
          company={guessing}
          busy={busy}
          onCancel={() => setGuessing(null)}
          onConfirm={async () => {
            try {
              await act({ type: 'guess', companyId: guessing.id });
              setGuessing(null);
              setGuessMode(false);
            } catch {}
          }}
        />
      )}
    </div>
  );
}
