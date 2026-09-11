import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { COMPANY_BY_ID, MAX_NAME_LENGTH, normalizeRoomCode, type Company, type RoomView } from 'shared';
import { useRoom } from '../hooks/useRoom';
import { lastName, rememberName } from '../api';
import Lobby from '../components/Lobby';
import Board from '../components/Board';
import TurnPanel from '../components/TurnPanel';
import QuestionLog from '../components/QuestionLog';
import GuessModal from '../components/GuessModal';
import Logo from '../components/Logo';

export default function Room() {
  const { code: raw = '' } = useParams();
  const code = normalizeRoomCode(raw);
  const { view, status, error, toast, busy, joinWithName, act } = useRoom(code);

  return (
    <main className="min-h-dvh px-4 py-3 sm:px-6 lg:py-5">
      <nav className="mx-auto mb-3 flex max-w-7xl items-center justify-between lg:mb-5">
        <Link to="/" className="display text-lg font-extrabold">
          Startup <span className="text-coral">Guess</span> Who
        </Link>
        <span className="display border-2 border-ink bg-white px-2 py-0.5 text-sm font-bold tracking-[0.2em]">{code}</span>
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
          {view.phase !== 'lobby' && <Game view={view} busy={busy} act={act} />}
        </>
      )}

      {toast && (
        <div className="display fixed bottom-5 left-1/2 z-50 -translate-x-1/2 border-2 border-ink bg-coral px-4 py-2 text-sm font-bold text-white rise" style={{ boxShadow: '4px 4px 0 var(--color-ink)' }}>
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
      <p className="text-xs uppercase tracking-wider text-ink-3">You've been invited to room</p>
      <p className="display text-4xl font-extrabold tracking-[0.15em]">{code}</p>
      <label className="mt-5 block text-xs uppercase tracking-wider text-ink-3">Your name</label>
      <input className="field mt-1" value={name} maxLength={MAX_NAME_LENGTH} autoFocus onChange={(e) => setName(e.target.value)} />
      {error && <p className="mt-2 text-sm text-coral">{error}</p>}
      <button className="btn btn-primary mt-4 w-full" disabled={!name.trim() || busy}>Join game</button>
    </form>
  );
}

type Act = ReturnType<typeof useRoom>['act'];

function Game({ view, busy, act }: { view: RoomView; busy: boolean; act: Act }) {
  const nav = useNavigate();
  const [guessMode, setGuessMode] = useState(false);
  const [guessing, setGuessing] = useState<Company | null>(null);
  const [logOpen, setLogOpen] = useState(false);
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
            <p className="text-xs uppercase tracking-wider text-ink-3">Your secret</p>
            <div className="mt-2 flex items-center gap-3 lg:block">
              <Logo company={secret} size={56} />
              <div>
                <div className="display mt-1 text-xl font-extrabold leading-tight">{secret.name}</div>
                <div className="text-xs text-ink-2">{secret.blurb}</div>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-ink-3">{opp?.name} is trying to guess this.</p>
          </div>
        )}
        <div className="panel p-4">
          <p className="text-xs uppercase tracking-wider text-ink-3">Round {view.round}</p>
          <ul className="mt-2 grid grid-cols-2 gap-2 text-sm lg:grid-cols-1">
            {view.players.map((p) => {
              const active = view.activePlayerId === p.id && !finished;
              return (
                <li key={p.id} className={`flex items-center justify-between border-2 px-2 py-1.5 ${active ? 'border-coral bg-coral-2' : 'border-ink/20'}`}>
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
      <div className="sticky top-0 z-30 -mx-4 border-b-2 border-ink bg-paper px-4 py-2 lg:hidden" style={{ boxShadow: '0 4px 0 rgba(22,20,18,0.08)' }}>
        <div className="flex items-center gap-3">
          {secret && (
            <div className="flex min-w-0 items-center gap-2">
              <Logo company={secret} size={36} />
              <div className="min-w-0 leading-tight">
                <div className="text-[10px] uppercase tracking-wider text-ink-3">Your secret</div>
                <div className="display truncate text-sm font-extrabold">{secret.name}</div>
              </div>
            </div>
          )}
          <div className="ml-auto flex items-center gap-2 text-xs">
            {view.players.map((p) => {
              const active = view.activePlayerId === p.id && !finished;
              return (
                <span key={p.id} className={`border-2 px-1.5 py-1 leading-none ${active ? 'border-coral bg-coral-2' : 'border-ink/20'}`}>
                  <b className="display">{p.id === view.me ? 'You' : p.name}</b> {p.remaining}
                </span>
              );
            })}
            <button className="btn btn-sm" onClick={() => setLogOpen(true)} aria-label="Open question log">
              Log{view.log.length ? ` ${view.log.length}` : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Center: board */}
      <section className="lg:order-none">
        {finished && view.finish && <ResultBanner view={view} busy={busy} onRematch={() => swallow(act({ type: 'rematch' }))} onHome={() => nav('/')} />}
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

      {/* Right: questions */}
      <aside className="panel hidden max-h-[calc(100vh-5rem)] min-h-[320px] flex-col p-4 lg:sticky lg:top-5 lg:flex">
        <p className="mb-3 text-xs uppercase tracking-wider text-ink-3">Questions</p>
        <QuestionLog log={view.log} pending={view.pendingQuestion} players={view.players} me={view.me} />
        {!finished && (
          <div className="mt-3 hidden border-t-2 border-ink pt-3 lg:block">
            <TurnPanel
              view={view}
              guessMode={guessMode}
              busy={busy}
              onAsk={(text) => act({ type: 'ask', text })}
              onAnswer={(answer) => act({ type: 'answer', answer })}
              onToggleGuess={() => setGuessMode((g) => !g)}
            />
          </div>
        )}
      </aside>

      {/* Mobile: question log as a bottom sheet */}
      {logOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-ink/60 lg:hidden" onClick={() => setLogOpen(false)}>
          <div className="panel flex max-h-[75vh] w-full flex-col bg-paper p-4 rise" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-ink-3">Questions</p>
              <button className="btn btn-sm" onClick={() => setLogOpen(false)}>Close</button>
            </div>
            <QuestionLog log={view.log} pending={view.pendingQuestion} players={view.players} me={view.me} />
          </div>
        </div>
      )}

      {/* Mobile: turn controls pinned to the bottom of the screen */}
      {!finished && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-paper px-4 pt-3 lg:hidden"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))', boxShadow: '0 -4px 0 rgba(22,20,18,0.08)' }}
        >
          <TurnPanel
            view={view}
            guessMode={guessMode}
            busy={busy}
            onAsk={(text) => act({ type: 'ask', text })}
            onAnswer={(answer) => act({ type: 'answer', answer })}
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

function ResultBanner({ view, busy, onRematch, onHome }: { view: RoomView; busy: boolean; onRematch: () => void; onHome: () => void }) {
  const f = view.finish!;
  const won = f.winnerId === view.me;
  const me = view.players.find((p) => p.id === view.me)!;
  const opp = view.players.find((p) => p.id !== view.me);
  const guessed = COMPANY_BY_ID[f.guessedCompanyId];
  const oppSecret = opp ? COMPANY_BY_ID[f.secrets[opp.id]] : null;
  const iGuessed = f.reason === 'correct-guess' ? won : !won;
  return (
    <div className={`panel mb-5 p-5 rise ${won ? 'bg-lime' : 'bg-coral-2'}`}>
      <p className="text-xs uppercase tracking-wider text-ink-2">Round {view.round} over</p>
      <h2 className="display text-4xl font-extrabold">{won ? 'You win.' : 'You lose.'}</h2>
      <p className="mt-2 text-sm">
        {iGuessed ? 'You' : opp?.name} guessed <b>{guessed?.name}</b>
        {f.reason === 'correct-guess' ? ' — correct!' : ' — wrong.'}
        {oppSecret && <> {opp?.name}'s secret was <b>{oppSecret.name}</b>.</>}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="btn btn-ink" disabled={busy || me.wantsRematch} onClick={onRematch}>
          {me.wantsRematch ? `Waiting for ${opp?.name}…` : opp?.wantsRematch ? `${opp.name} wants a rematch!` : 'Rematch'}
        </button>
        <button className="btn" onClick={onHome}>Home</button>
      </div>
    </div>
  );
}
