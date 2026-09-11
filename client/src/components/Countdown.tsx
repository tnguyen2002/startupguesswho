import { useEffect, useState } from 'react';
import { TURN_SECONDS } from 'shared';

interface Props {
  /** Server-time deadline in epoch ms, or null when no timer is running. */
  deadline: number | null;
  /** Server clock at the moment the snapshot was taken; used to correct for device clock drift. */
  serverNow: number;
  /** Client clock at the moment the snapshot was received. */
  receivedAt: number;
  onExpire?: () => void;
  size?: 'sm' | 'lg';
}

export default function Countdown({ deadline, serverNow, receivedAt, onExpire, size = 'lg' }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (deadline === null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [deadline]);

  const drift = serverNow - receivedAt;
  const remainingMs = deadline === null ? 0 : Math.max(0, deadline - (now + drift));
  const expired = deadline !== null && remainingMs === 0;

  // Ask the room hook to poll right away once the timer hits zero, so the passed turn shows up fast.
  useEffect(() => {
    if (expired) onExpire?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired]);

  if (deadline === null) return null;
  const seconds = Math.ceil(remainingMs / 1000);
  const fraction = Math.min(1, remainingMs / (TURN_SECONDS * 1000));

  const urgent = seconds <= 5;
  const r = size === 'lg' ? 22 : 12;
  const stroke = size === 'lg' ? 4 : 3;
  const c = 2 * Math.PI * r;
  const box = (r + stroke) * 2;
  return (
    <div className="inline-flex items-center gap-2" aria-live="polite" aria-label={`${seconds} seconds left`}>
      <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} className="-rotate-90">
        <circle cx={box / 2} cy={box / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        <circle
          cx={box / 2} cy={box / 2} r={r} fill="none"
          stroke={urgent ? 'var(--color-coral)' : 'var(--color-ink)'}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - fraction)}
          style={{ transition: 'stroke-dashoffset 250ms linear, stroke 200ms' }}
        />
      </svg>
      <span className={`display tabular-nums font-bold ${size === 'lg' ? 'text-xl' : 'text-sm'} ${urgent ? 'text-coral' : ''}`}>
        {seconds}s
      </span>
    </div>
  );
}
