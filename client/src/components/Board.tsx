import type { Company } from 'shared';
import CompanyCard from './CompanyCard';

interface Props {
  board: Company[];
  flipped: Set<string>;
  mode: 'flip' | 'guess';
  mySecretId: string | null;
  onFlip: (id: string, down: boolean) => void;
  onGuess: (company: Company) => void;
}

export default function Board({ board, flipped, mode, mySecretId, onFlip, onGuess }: Props) {
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
      {board.map((c, i) => (
        <CompanyCard
          key={c.id}
          index={i}
          company={c}
          down={flipped.has(c.id)}
          mode={mode}
          isSecret={c.id === mySecretId}
          onClick={() => (mode === 'guess' ? onGuess(c) : onFlip(c.id, !flipped.has(c.id)))}
        />
      ))}
    </div>
  );
}
