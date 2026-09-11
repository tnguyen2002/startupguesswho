import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DECK, normalizeRoomCode } from 'shared';
import { api, lastName, saveSession } from '../api';
import Logo from '../components/Logo';
import PreviewBoard from '../components/PreviewBoard';

const PREVIEW_IDS = ['stripe', 'anduril', 'canva', 'revolut', 'spacex', 'notion', 'oura', 'databricks', 'openai'];

export default function Home() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get('code') ?? '');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<number | null>(null);
  useEffect(() => { api.stats().then((s) => setGames(s.games)).catch(() => {}); }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy('create'); setError(null);
    try {
      const name = lastName();
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
      const name = lastName();
      const data = await api.joinRoom(normalizeRoomCode(code), name);
      saveSession(data.code, { token: data.token, name });
      nav(`/room/${data.code}`);
    } catch (err) {
      setError((err as Error).message);
    } finally { setBusy(null); }
  }

  const strip = [...DECK.slice(0, 20), ...DECK.slice(0, 20)];

  return (
    <main className="flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-10 sm:px-8 lg:py-14">
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="display text-5xl font-bold leading-[0.9] sm:text-6xl xl:text-7xl rise" style={{ animationDelay: '60ms' }}>
            Startup <span aria-label="unicorn" role="img">🦄</span>
            <br />
            Guess Who
          </h1>
          {games !== null && (
            <p className="mt-3 text-sm text-ink-3">
              <span className="display font-semibold text-ink tabular-nums">{games.toLocaleString()}</span> {games === 1 ? 'game' : 'games'} played so far
            </p>
          )}

          <div className="mt-8 grid items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
            {/* Left: animated board preview, same height as the play card */}
            <PreviewBoard initialIds={PREVIEW_IDS} />

            {/* Right: play card */}
            <section className="panel flex w-full flex-col justify-center p-6 rise sm:p-8" style={{ animationDelay: '160ms' }}>

              <form onSubmit={create}>
                <h2 className="display text-xl font-bold">Start a room</h2>
                <p className="mt-0.5 text-xs text-ink-2">One click. You'll get a 6-letter code to share.</p>
                <button className="btn btn-primary mt-3 w-full" disabled={busy !== null}>
                  {busy === 'create' ? 'Creating…' : 'Create room'}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3 text-[11px] text-ink-3">
                <span className="h-px flex-1 bg-ink/20" />or join one<span className="h-px flex-1 bg-ink/20" />
              </div>

              <form onSubmit={join}>
                <div className="flex gap-2">
                  <input
                    className="field text-center font-display text-xl font-bold tracking-[0.25em]"
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
                <p className="mt-2 text-xs text-ink-2">Enter the code your friend sent you.</p>
              </form>

              {error && <p className="mt-4 border border-coral/30 bg-coral-2 px-3 py-2 text-sm rounded-xl">{error}</p>}
            </section>
          </div>
        </div>
      </div>

      <footer className="border-t border-line">
        <div className="overflow-hidden py-2.5">
          <div className="marquee flex w-max gap-2.5">
            {strip.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 border border-line bg-white px-2 py-0.5 rounded-xl">
                <Logo company={c} size={18} />
                <span className="display text-xs font-bold">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
