import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { COMPANIES, MAX_NAME_LENGTH, normalizeRoomCode } from 'shared';
import { api, lastName, rememberName, saveSession } from '../api';
import Logo from '../components/Logo';

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

  const strip = [...COMPANIES.slice(0, 18), ...COMPANIES.slice(0, 18)];

  return (
    <main className="min-h-dvh px-4 py-8 sm:px-8">
      <header className="mx-auto max-w-5xl">
        <p className="text-xs uppercase tracking-[0.3em] text-ink-3 rise">A two-player deduction game</p>
        <h1 className="display mt-2 text-[13vw] font-extrabold leading-[0.85] sm:text-8xl rise" style={{ animationDelay: '60ms' }}>
          Startup
          <br />
          <span className="text-coral">Guess</span> Who
        </h1>
        <p className="mt-5 max-w-xl text-sm text-ink-2 rise sm:text-base" style={{ animationDelay: '120ms' }}>
          Twenty-four unicorns on the board. One of them is your opponent's secret. Ask yes/no questions about sector, HQ,
          founding year, valuation, or whether it's still alive, and flip the losers down.
        </p>
      </header>

      <div className="relative mx-auto my-8 max-w-5xl overflow-hidden border-y-2 border-ink py-3 rise" style={{ animationDelay: '180ms' }}>
        <div className="marquee flex w-max gap-3">
          {strip.map((c, i) => (
            <div key={i} className="flex items-center gap-2 border-2 border-ink bg-white px-2 py-1">
              <Logo company={c} size={22} />
              <span className="display text-sm font-bold">{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[1fr_1fr]">
        <div className="panel p-6 rise" style={{ animationDelay: '220ms' }}>
          <label className="text-xs uppercase tracking-wider text-ink-3">Your name</label>
          <input
            className="field mt-1"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            placeholder="e.g. Marc"
            onChange={(e) => setName(e.target.value)}
          />
          <form onSubmit={create} className="mt-6">
            <h2 className="display text-2xl font-extrabold">Start a room</h2>
            <p className="mt-1 text-sm text-ink-2">You'll get a 6-letter code to share.</p>
            <button className="btn btn-primary mt-4 w-full" disabled={!name.trim() || busy !== null}>
              {busy === 'create' ? 'Creating…' : 'Create room'}
            </button>
          </form>
        </div>

        <form onSubmit={join} className="panel p-6 rise" style={{ animationDelay: '280ms' }}>
          <h2 className="display text-2xl font-extrabold">Join a room</h2>
          <p className="mt-1 text-sm text-ink-2">Paste the code your friend sent you.</p>
          <input
            className="field mt-4 text-center font-display text-3xl font-extrabold uppercase tracking-[0.3em]"
            value={code}
            maxLength={6}
            placeholder="ABC123"
            onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
          />
          <button className="btn btn-ink mt-4 w-full" disabled={!name.trim() || code.length !== 6 || busy !== null}>
            {busy === 'join' ? 'Joining…' : 'Join room'}
          </button>
        </form>
      </section>

      {error && (
        <p className="mx-auto mt-4 max-w-5xl border-2 border-coral bg-coral-2 px-4 py-2 text-sm text-ink">{error}</p>
      )}

      <footer className="mx-auto mt-12 max-w-5xl text-xs text-ink-3">
        {COMPANIES.length} companies in the deck · valuations are approximate peaks · logos via public favicon service
      </footer>
    </main>
  );
}
