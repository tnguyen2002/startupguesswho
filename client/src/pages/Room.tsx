import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { COMPANY_BY_ID, MAX_NAME_LENGTH, normalizeRoomCode, type Company, type RoomView } from 'shared';
import { useRoom } from '../hooks/useRoom';
import { lastName, rememberName } from '../api';
import Lobby from '../components/Lobby';
import Board from '../components/Board';
import TurnPanel from '../components/TurnPanel';
import Countdown from '../components/Countdown';
import GuessModal from '../components/GuessModal';
import ResultScreen from '../components/ResultScreen';
import Logo from '../components/Logo';

export default function Room() {
  const { code: raw = '' } = useParams();
  const code = normalizeRoomCode(raw);
  const { view, receivedAt, status, error, toast, busy, joinWithName, act, refresh } = useRoom(code);

  return (
    <main className="min-h-dvh px-4 py-3 sm:px-6 lg:py-5">
      <nav className="mx-auto mb-3 flex max-w-7xl items-center justify-between lg:mb-5">
        <Link to="/" className="display whitespace-nowrap text-base font-bold sm:text-lg">
          Startup <span className="text-coral">Guess</span> Who
        </Link>
        <span className="display border border-line bg-white px-2 py-0.5 text-sm font-bold tracking-[0.2em] rounded-xl">{code}</span>
      </nav>

      {status === 'connecting' && <p className="text-center text-ink-3">Connecting…</p>}
      {status === 'error' && (
        <div className="mx-auto max-w-md panel p-6 text-center">
          <p className="display text-xl font-bold">Couldn't open this room</p>
          <p className="mt-2 text-sm text-ink-2">{error}</p>
          <Link to="/" className="btn mt-5">Back home</Link>
        </div>
      )}
      {status === 'need-name' && <JoinForm code={code} busy={busy} error={error} onJoin={joinWithName} />}
      {status === 'joined' && view && (
        <>
          {view.phase === 'lobby' && <Lobby view={view} busy={busy} onStart={() => act({ type: 'start' }).catch(() => {})} />}
          {view.phase !== 'lobby' && <Game view={view} receivedAt={receivedAt} busy={busy} act={act} refresh={refresh} />}
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

function JoinForm({ code, busy, error, onJoin }: { code: string; busy: boolean; error: string | null; onJoin: (n: string) => void }) {
  const [name, setName] = useState(lastName());
  const submit = (e: FormEvent) => { e.preventDefault(); rememberName(name); onJoin(name); };
  return (
    <form onSubmit={submit} className="mx-auto max-w-md panel p-6 rise">
      <p className="text-xs text-ink-3">You've been invited to room</p>
      <p className="display text-4xl font-bold tracking-[0.15em]">{code}</p>
      <label className="mt-5 block text-xs text-ink-3">Your name (optional)</label>
      <input className="field mt-1" value={name} maxLength={MAX_NAME_LENGTH} autoFocus onChange={(e) => setName(e.target.value)} />
      {error && <p className="mt-2 text-sm text-coral">{error}</p>}
      <button className="btn btn-primary mt-4 w-full" disabled={busy}>Join game</button>
    </form>
  );
}

type Act = ReturnType<typeof useRoom>['act'];

function Game({ view, receivedAt, busy, act, refresh }: { view: RoomView; receivedAt: number; busy: boolean; act: Act; refresh: () => void }) {
  const nav = useNavigate();
  const [guessMode, setGuessMode] = useState(false);
  const [guessing, setGuessing] = useState<Company | null>(null);
  const flipped = useMemo(() => new Set(view.myFlipped), [view.myFlipped]);
  const me = view.players.find((p) => p.id === view.me)!;
  const opp = view.players.find((p) => p.id !== view.me);
  const secret = view.mySecretId ? COMPANY_BY_ID[view.mySecretId] : null;
  const myTurn = view.activePlayerId === view.me && view.stage === 'asking';
  const finished = view.phase === 'finished';

  const swallow = (p: Promise<unknown>) => p.catch(() => {});

  return (
    <div className="mx-auto grid max-w-7xl gap-4 pb-36 lg:gap-5 lg:grid-cols-[200px_1fr_280px] lg:pb-0 xl:grid-cols-[220px_1fr_320px]">
      {/* Left: secret + status */}
      <aside className="hidden space-y-4 lg:block lg:sticky lg:top-5 lg:self-start">
        {secret && (
          <div className="panel p-4">
            <p className="text-xs text-ink-3">Your secret</p>
            <div className="mt-2 flex items-center gap-3 lg:block">
              <Logo company={secret} size={56} />
              <div>
                <div className="display mt-1 text-xl font-bold leading-tight">{secret.name}</div>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-ink-3">{opp?.name} is trying to guess this.</p>
          </div>
        )}
        <div className="panel p-4">
          <p className="text-xs text-ink-3">Round {view.round}</p>
          <ul className="mt-2 grid grid-cols-2 gap-2 text-sm lg:grid-cols-1">
            {view.players.map((p) => {
              const active = view.activePlayerId === p.id && !finished;
              return (
                <li key={p.id} className={`flex items-center justify-between border-2 px-2 py-1.5 ${active ? 'border-coral bg-coral-2' : 'border-line'} rounded-xl`}>
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${p.connected ? 'bg-mint' : 'bg-ink-3'} ${active ? 'pulse' : ''}`} />
                    <b className="display">{p.id === view.me ? 'You' : p.name}</b>
                  </span>
                  <span className="text-xs text-ink-2">{p.remaining} left</span>
                </li>
              );
            })}
          </ul>
          {opp && !opp.connected && <p className="mt-2 text-xs text-coral">{opp.name} disconnected. They can rejoin with the same link.</p>}
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
                <span key={p.id} className={`whitespace-nowrap border-2 px-1.5 py-1 leading-none ${active ? 'border-coral bg-coral-2' : 'border-line'} rounded-xl`}>
                  <b className="display">{p.id === view.me ? 'You' : p.name}</b> {p.remaining}
                </span>
              );
            })}
            {!finished && <Countdown deadline={view.turnDeadline} serverNow={view.serverNow} receivedAt={receivedAt} size="sm" />}
          </div>
        </div>
      </div>

      {/* Center: board */}
      <section className="lg:order-none">
        {finished && view.finish && <ResultScreen view={view} busy={busy} onRematch={() => swallow(act({ type: 'rematch' }))} onHome={() => nav('/')} />}
        <div className={finished ? 'pointer-events-none opacity-70' : ''}>
          <Board
            board={view.board}
            flipped={flipped}
            mode={guessMode && myTurn ? 'guess' : 'flip'}
            mySecretId={view.mySecretId}
            onFlip={(id, down) => swallow(act({ type: 'flip', companyId: id, down }))}
            onGuess={(c) => setGuessing(c)}
          />
        </div>
      </section>

      {/* Right: current turn */}
      {!finished && (
        <aside className="panel hidden p-4 lg:sticky lg:top-5 lg:block lg:self-start">
          <TurnPanel
            view={view}
            receivedAt={receivedAt}
            guessMode={guessMode}
            busy={busy}
            onAsk={(text) => act({ type: 'ask', text })}
            onAnswer={(answer) => act({ type: 'answer', answer })}
            onToggleGuess={() => setGuessMode((g) => !g)}
            onExpire={refresh}
          />
        </aside>
      )}

      {/* Mobile: turn controls pinned to the bottom of the screen */}
      {!finished && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white px-4 pt-3 lg:hidden"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))', boxShadow: '0 -4px 16px rgba(0,0,0,0.06)' }}
        >
          <TurnPanel
            view={view}
            receivedAt={receivedAt}
            guessMode={guessMode}
            busy={busy}
            onAsk={(text) => act({ type: 'ask', text })}
            onAnswer={(answer) => act({ type: 'answer', answer })}
            onToggleGuess={() => setGuessMode((g) => !g)}
            onExpire={refresh}
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
