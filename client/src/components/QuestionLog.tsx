import { useEffect, useRef } from 'react';
import type { LogEntry, PlayerView } from 'shared';

interface Props {
  log: LogEntry[];
  pending: LogEntry | null;
  players: PlayerView[];
  me: string;
}

export default function QuestionLog({ log, pending, players, me }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [log.length, pending?.id]);

  const nameOf = (id: string) => (id === me ? 'You' : players.find((p) => p.id === id)?.name ?? '?');
  const entries = pending ? [...log, pending] : log;

  return (
    <div ref={ref} className="flex-1 space-y-3 overflow-y-auto pr-1 text-sm">
      {entries.length === 0 && (
        <p className="text-ink-3">No questions yet. Ask something like “Is it a fintech?” or “Is it still alive?”</p>
      )}
      {entries.map((e) => {
        const mine = e.askerId === me;
        return (
          <div key={e.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] text-ink-3">{nameOf(e.askerId)} asked</span>
            <div className={`max-w-[92%] border border-line px-3 py-2 ${mine ? 'bg-white' : 'bg-paper'} rounded-xl`}>
              {e.question}
            </div>
            <div className="mt-1">
              {e.answer ? (
                <span
                  className={`display inline-block border border-line px-2 py-0.5 text-xs font-bold ${
                    e.answer === 'yes' ? 'bg-mint-2 text-mint' : 'bg-coral text-white'
                  } rounded-xl`}
                >
                  {e.answer}
                </span>
              ) : (
                <span className="text-xs italic text-ink-3">waiting for an answer…</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
