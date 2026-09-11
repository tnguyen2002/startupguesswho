import { useEffect, useState } from 'react';
import type { Company } from 'shared';
import Logo from './Logo';

interface Props {
  company: Company;
  down: boolean;
  mode: 'flip' | 'guess';
  isSecret?: boolean;
  onClick: () => void;
  index: number;
}

function useWide() {
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return wide;
}

export default function CompanyCard({ company, down, mode, isSecret, onClick, index }: Props) {
  const wide = useWide();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={down}
      aria-label={`${company.name}${down ? ' (flipped down)' : ''}`}
      className="card-scene group relative w-full rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-coral rise"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {isSecret && (
        <span className="display absolute -top-2 -left-2 z-10 rounded-md bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white">
          you
        </span>
      )}
      <div className={`card-inner ${down ? 'is-down' : ''}`}>
        <div
          className={`card-face card-front flex aspect-square flex-col rounded-2xl border border-line bg-white p-1.5 sm:p-2 transition-shadow ${
            mode === 'guess' ? 'group-hover:bg-coral-2 cursor-crosshair' : 'group-hover:-translate-y-0.5 group-hover:shadow-md cursor-pointer'
          }`}
        >
          <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center sm:gap-2">
            <Logo company={company} size={wide ? 56 : 28} />
            <div className="display line-clamp-2 w-full break-words text-[9px] font-semibold leading-[1.1] sm:text-[13px] sm:leading-tight">{company.name}</div>
          </div>
          {mode === 'guess' && (
            <div className="display pointer-events-none absolute inset-x-0 bottom-0 translate-y-full rounded-b-xl bg-coral py-1 text-center text-xs font-bold text-white transition-transform group-hover:translate-y-0">
              Guess this
            </div>
          )}
        </div>
        <div className="card-face card-back rounded-2xl border border-line" aria-hidden="true" />
      </div>
    </button>
  );
}
