import { useCallback, useEffect, useRef, useState } from 'react';
import type { Action, RoomView } from 'shared';
import { api, ApiError, loadSession, saveSession } from '../api';

export type RoomStatus = 'connecting' | 'joined' | 'need-name' | 'error';

/** Poll faster while waiting on the opponent, slower when the ball is in our court. */
function pollInterval(view: RoomView | null): number {
  if (!view) return 1500;
  if (view.phase === 'lobby') return 1500;
  if (view.phase === 'finished') return 2000;
  const myMove = (view.stage === 'asking') === (view.activePlayerId === view.me);
  return myMove ? 3000 : 1200;
}

export function useRoom(code: string) {
  const [view, setView] = useState<RoomView | null>(null);
  const [receivedAt, setReceivedAt] = useState(() => Date.now());
  const refreshRef = useRef<() => void>(() => {});
  const [status, setStatus] = useState<RoomStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const tokenRef = useRef<string | null>(loadSession(code)?.token ?? null);
  const viewRef = useRef<RoomView | null>(null);

  const apply = useCallback((v: RoomView) => {
    // Ignore stale responses that raced a newer one.
    if (viewRef.current && v.version < viewRef.current.version) return;
    viewRef.current = v;
    setView(v);
    setReceivedAt(Date.now());
    setStatus('joined');
  }, []);

  // Polling loop.
  useEffect(() => {
    if (!tokenRef.current) { setStatus('need-name'); return; }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;

    const tick = async () => {
      if (cancelled) return;
      try {
        const v = await api.getState(code, tokenRef.current!);
        failures = 0;
        apply(v);
      } catch (e) {
        if (e instanceof ApiError && (e.status === 404 || e.status === 400)) {
          setError(e.message);
          setStatus('error');
          return;
        }
        failures++;
      }
      if (!cancelled) timer = setTimeout(tick, pollInterval(viewRef.current) * Math.min(1 + failures, 5));
    };
    refreshRef.current = () => { clearTimeout(timer); void tick(); };
    void tick();
    const onVisible = () => { if (document.visibilityState === 'visible') { clearTimeout(timer); void tick(); } };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [code, status === 'need-name', apply]); // re-run once a token appears

  const joinWithName = useCallback(async (name: string) => {
    setBusy(true); setError(null);
    try {
      const data = await api.joinRoom(code, name);
      saveSession(data.code, { token: data.token, name });
      tokenRef.current = data.token;
      setStatus('connecting');
    } catch (e) {
      setError((e as Error).message);
    } finally { setBusy(false); }
  }, [code]);

  const act = useCallback(async (action: Action) => {
    if (!tokenRef.current) return;
    setBusy(true);
    try {
      apply(await api.act(code, tokenRef.current, action));
    } catch (e) {
      setToast((e as Error).message);
      setTimeout(() => setToast(null), 2500);
      throw e;
    } finally { setBusy(false); }
  }, [code, apply]);

  const refresh = useCallback(() => refreshRef.current(), []);

  return { view, receivedAt, status, error, toast, busy, joinWithName, act, refresh };
}
