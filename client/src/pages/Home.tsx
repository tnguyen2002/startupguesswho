import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { COMPANIES, MAX_NAME_LENGTH, normalizeRoomCode, valuationTier } from 'shared';
import { api, lastName, rememberName, saveSession } from '../api';
import Logo from '../components/Logo';

const PREVIEW_IDS = ['stripe', 'theranos', 'canva', 'ftx', 'spacex', 'notion', 'wework', 'nubank', 'openai'];

export default function Home() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [name, setName] = useState(lastName());
  const [code, setCode] = useState(params.get('code') ?? '');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy('create'); setError(null);
    try {
      rememberName(name);
      const data = await api.createRoom(name);
      saveSession(data.code, { token: data.token, name });
      nav(`/room/${data.code}`);
    } catch (err) {
      setError((err as Error).message);
    } finally { setBusy(null); }
  }

  async function join(e: FormEvent) {
    e.preventDefault();
    setBusy('join'); setError(null);
    try {
      rememberName(name);
      const data = await api.joinRoom(normalizeRoomCode(code), name);
      saveSession(data.code, { token: data.token, name });
      nav(`/room/${data.code}`);
    } catch (err) {
      setError((err as Error).message);
    } finally { setBusy(null); }
  }

  const preview = PREVIEW_IDS.map((id) => COMPANIES.find((c) => c.id === id)!);
  const strip = [...COMPANIES.slice(0, 20), ...COMPANIES.slice(0, 20)];

  return (
    <main className="flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-10 sm:px-8 lg:py-14">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
          {/* Left: pitch + board preview */}
          <section>
            <p className="text-[11px] uppercase tracking-[0.3em] text-ink-3 rise">A two-player deduction game</p>
            <h1 className="display mt-3 text-5xl font-extrabold leading-[0.9] sm:text-6xl xl:text-7xl rise" style={{ animationDelay: '60ms' }}>
              Startup
              <br />
              <span className="text-coral">Guess</span> Who
            </h1>

            <div className="mt-8 hidden max-w-md grid-cols-3 gap-2 rise sm:grid" style={{ animationDelay: '200ms' }}>
              {preview.map((c, i) => {
                const down = i === 1 || i === 6;
                const tilt = ((i * 7919) % 5) - 2;
                return (
                  <div
                    key={c.id}
                    className={`border-2 border-ink p-2 ${down ? 'back-pattern' : 'bg-white'}`}
                    style={{ boxShadow: '3px 3px 0 var(--color-ink)', transform: `rotate(${down ? tilt * 2 : 0}deg)` }}
                  >
                    {down ? (
                      <div className="display flex h-full min-h-[72px] items-center justify-center text-[10px] font-bold uppercase tracking-widest text-paper/70">out</div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Logo company={c} size={28} />
                          <span className="display truncate text-xs font-bold">{c.name}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="chip">{c.sector}</span>
                          <span className="chip bg-paper-2">{valuationTier(c.peakValuationB)}</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right: play card */}
          <section className="panel mx-auto w-full max-w-md p-6 rise sm:p-8" style={{ animationDelay: '160ms' }}>
            <label className="text-[11px] uppercase tracking-wider text-ink-3" htmlFor="name">Your name <span className="normal-case tracking-normal text-ink-3/70">(optional)</span></label>
            <input
              id="name"
              className="field mt-1"
              value={name}
              maxLength={MAX_NAME_LENGTH}
              placeholder="e.g. Marc"
              autoComplete="nickname"
              onChange={(e) => setName(e.target.value)}
            />

            <form onSubmit={create} className="mt-6">
              <h2 className="display text-xl font-extrabold">Start a room</h2>
              <p className="mt-0.5 text-xs text-ink-2">One click. You'll get a 6-letter code to share.</p>
              <button className="btn btn-primary mt-3 w-full" disabled={busy !== null}>
                {busy === 'create' ? 'Creating…' : 'Create room'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-wider text-ink-3">
              <span className="h-px flex-1 bg-ink/20" />or join one<span className="h-px flex-1 bg-ink/20" />
            </div>

            <form onSubmit={join}>
              <div className="flex gap-2">
                <input
                  className="field text-center font-display text-xl font-extrabold uppercase tracking-[0.25em]"
                  value={code}
                  maxLength={6}
                  placeholder="ABC123"
                  aria-label="Room code"
                  onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
                />
                <button className="btn btn-ink shrink-0" disabled={code.length !== 6 || busy !== null}>
                  {busy === 'join' ? '…' : 'Join'}
                </button>
              </div>
              <p className="mt-2 text-xs text-ink-2">Paste the code or open the link your friend sent you.</p>
            </form>

            {error && <p className="mt-4 border-2 border-coral bg-coral-2 px-3 py-2 text-sm">{error}</p>}
          </section>
        </div>
      </div>

      <footer className="border-t-2 border-ink">
        <div className="overflow-hidden py-2.5">
          <div className="marquee flex w-max gap-2.5">
            {strip.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 border-2 border-ink bg-white px-2 py-0.5">
                <Logo company={c} size={18} />
                <span className="display text-xs font-bold">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="border-t border-ink/20 px-5 py-2 text-center text-[11px] text-ink-3 sm:px-8">
          {COMPANIES.length} companies in the deck · valuations are approximate peaks · logos via public favicon service
        </p>
      </footer>
    </main>
  );
}
