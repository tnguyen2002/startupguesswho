import { valuationTier, type Company } from 'shared';
import Logo from './Logo';

const STATUS_LABEL: Record<Company['status'], string> = {
  private: 'Private',
  public: 'Public',
  acquired: 'Acquired',
  defunct: 'Defunct',
};
const STATUS_COLOR: Record<Company['status'], string> = {
  private: 'bg-lime',
  public: 'bg-mint text-white',
  acquired: 'bg-ink text-paper',
  defunct: 'bg-coral text-white',
};

interface Props {
  company: Company;
  down: boolean;
  mode: 'flip' | 'guess';
  isSecret?: boolean;
  onClick: () => void;
  index: number;
}

export default function CompanyCard({ company, down, mode, isSecret, onClick, index }: Props) {
  const tilt = ((index * 7919) % 5) - 2; // deterministic -2..2 deg
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={down}
      aria-label={`${company.name}${down ? ' (flipped down)' : ''}`}
      className="card-scene group relative w-full text-left focus:outline-none rise"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div
        className={`card-inner ${down ? 'is-down' : ''}`}
        style={{ transform: down ? `rotateY(180deg) rotate(${tilt}deg)` : undefined }}
      >
        <div
          className={`card-face card-front flex min-h-[150px] flex-col border-2 border-ink bg-white p-2 transition-shadow ${
            mode === 'guess' ? 'group-hover:bg-coral-2 cursor-crosshair' : 'group-hover:-translate-y-0.5 cursor-pointer'
          }`}
          style={{ boxShadow: '3px 3px 0 var(--color-ink)' }}
        >
          {isSecret && (
            <span className="display absolute -top-2 -left-2 z-10 bg-coral px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-white" style={{ boxShadow: '2px 2px 0 var(--color-ink)' }}>
              you
            </span>
          )}
          <div className="flex items-start justify-between gap-1">
            <Logo company={company} size={44} />
            <span className={`chip ${STATUS_COLOR[company.status]} border-transparent`}>{STATUS_LABEL[company.status]}</span>
          </div>
          <div className="display mt-2 text-[14px] font-bold leading-tight break-words">{company.name}</div>
          <div className="mt-auto flex flex-wrap gap-1 pt-2">
            <span className="chip">{company.sector}</span>
            <span className="chip">{company.hqCountry}</span>
            <span className="chip">{company.founded}</span>
            <span className="chip bg-paper-2">{valuationTier(company.peakValuationB)}</span>
          </div>
          {mode === 'guess' && (
            <div className="display pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-coral py-1 text-center text-xs font-bold uppercase text-white transition-transform group-hover:translate-y-0">
              Guess this
            </div>
          )}
        </div>
        <div className="card-face card-back flex items-center justify-center border-2 border-ink">
          <span className="display rotate-[-12deg] text-paper/70 text-xs font-bold uppercase tracking-widest">out</span>
        </div>
      </div>
    </button>
  );
}
