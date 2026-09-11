import { useEffect, useState } from 'react';
import { COMPANY_BY_ID, type RoomView } from 'shared';
import { LOSER_IMAGES, WINNER_IMAGES } from '../results';

const SLIDE_MS = 2500;

interface Props {
  view: RoomView;
  busy: boolean;
  onRematch: () => void;
  onHome: () => void;
}

/** Full-screen end-of-round takeover with a meme slideshow. */
export default function ResultScreen({ view, busy, onRematch, onHome }: Props) {
  const f = view.finish!;
  const won = f.winnerId === view.me;
  const me = view.players.find((p) => p.id === view.me)!;
  const opp = view.players.find((p) => p.id !== view.me);
  const guessed = COMPANY_BY_ID[f.guessedCompanyId];
  const oppSecret = opp ? COMPANY_BY_ID[f.secrets[opp.id]] : null;
  const iGuessed = f.reason === 'correct-guess' ? won : !won;
  const images = won ? WINNER_IMAGES : LOSER_IMAGES;

  const [slide, setSlide] = useState(0);
  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % images.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [images]);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto px-5 py-8 text-center ${won ? 'bg-ink text-white' : 'bg-coral-2 text-ink'}`}>
      <div className="relative aspect-square w-full max-w-[320px] overflow-hidden rounded-3xl shadow-2xl sm:max-w-[380px] rise">
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
            style={{ opacity: i === slide ? 1 : 0 }}
          />
        ))}
      </div>

      <h1 className="display mt-6 text-6xl font-bold tracking-tight sm:text-7xl rise" style={{ animationDelay: '80ms' }}>
        {won ? 'Winner' : 'Loser'}
      </h1>
      <p className={`mt-3 max-w-md text-sm sm:text-base rise ${won ? 'text-white/70' : 'text-ink-2'}`} style={{ animationDelay: '140ms' }}>
        {iGuessed ? 'You' : 'Your opponent'} guessed <b>{guessed?.name}</b>
        {f.reason === 'correct-guess' ? ', correct.' : ', wrong.'}
        {oppSecret && <> Their secret was <b>{oppSecret.name}</b>.</>}
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3 rise" style={{ animationDelay: '200ms' }}>
        <button className={`btn ${won ? 'btn-coral' : 'btn-ink'}`} disabled={busy || me.wantsRematch} onClick={onRematch}>
          {me.wantsRematch ? 'Waiting for opponent…' : opp?.wantsRematch ? 'Opponent wants a rematch' : 'Rematch'}
        </button>
        <button className="btn" onClick={onHome}>Home</button>
      </div>
    </div>
  );
}
