import { useEffect, useState } from 'react';
import { DECK, type Company } from 'shared';
import Logo from './Logo';

const SLOTS = 9;
const TICK_MS = 1100;

interface Slot {
  company: Company;
  down: boolean;
}

function randomCompany(exclude: Set<string>): Company {
  const pool = DECK.filter((c) => !exclude.has(c.id));
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Decorative board for the home page: cards keep flipping down and back up with new companies. */
export default function PreviewBoard() {
  const [slots, setSlots] = useState<Slot[]>(() => {
    // Same pool as a real board: a random hand from the full deck.
    const shuffled = DECK.slice().sort(() => Math.random() - 0.5);
    return shuffled.slice(0, SLOTS).map((company, i) => ({ company, down: i === 1 || i === 6 }));
  });

  useEffect(() => {
    const id = setInterval(() => {
      setSlots((prev) => {
        const next = prev.slice();
        const i = Math.floor(Math.random() * next.length);
        const slot = next[i];
        if (slot.down) {
          // Flip back up showing a company not currently on the board.
          const onBoard = new Set(next.map((s) => s.company.id));
          next[i] = { company: randomCompany(onBoard), down: false };
        } else {
          // Keep at most three cards down at once so the board never looks empty.
          if (next.filter((s) => s.down).length >= 3) return prev;
          next[i] = { ...slot, down: true };
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hidden h-full grid-cols-3 grid-rows-3 gap-3 rise sm:grid" style={{ animationDelay: '200ms' }} aria-hidden="true">
      {slots.map((slot, i) => (
        <div key={i} className="card-scene min-h-[110px]">
          <div className={`card-inner ${slot.down ? 'is-down' : ''}`}>
            <div className="card-face card-front flex h-full flex-col items-center justify-center gap-1.5 rounded-xl border border-line bg-white p-2 text-center">
              {/* key forces a fresh fade-in for the logo when the company changes */}
              <Logo key={slot.company.id} company={slot.company} size={44} />
              <span className="display w-full truncate text-xs font-bold">{slot.company.name}</span>
            </div>
            <div className="card-face card-back rounded-xl border border-line" />
          </div>
        </div>
      ))}
    </div>
  );
}
