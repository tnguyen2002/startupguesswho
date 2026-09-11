import type { Company } from 'shared';
import Logo from './Logo';

interface Props {
  company: Company;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function GuessModal({ company, busy, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" onClick={onCancel}>
      <div className="panel w-full max-w-md bg-paper p-6 rise" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs uppercase tracking-wider text-ink-3">Final answer?</p>
        <div className="mt-3 flex items-center gap-4">
          <Logo company={company} size={64} />
          <div>
            <div className="display text-2xl font-extrabold">{company.name}</div>
            <div className="text-sm text-ink-2">{company.blurb}</div>
          </div>
        </div>
        <p className="mt-4 text-sm">
          If this is your opponent's secret, you win. If not, <b className="text-coral">you lose instantly</b>.
        </p>
        <div className="mt-5 flex gap-3">
          <button className="btn flex-1" onClick={onCancel} disabled={busy}>Back</button>
          <button className="btn btn-primary flex-1" onClick={onConfirm} disabled={busy}>Lock it in</button>
        </div>
      </div>
    </div>
  );
}
