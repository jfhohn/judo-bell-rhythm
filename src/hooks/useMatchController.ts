import { useCallback, useEffect, useRef, useState } from 'react';
import { MatchEvent, MatchState } from '@/lib/matchTypes';
import { liveClockSec, liveOsaekomiSec, matchReducer } from '@/lib/matchReducer';
import { saveMatch } from '@/lib/matchStore';

const UNDO_LIMIT = 100;
const NON_UNDOABLE = new Set<MatchEvent['type']>(['CLOCK_TICK']);

/**
 * Owns the match state, undo stack, animation-frame tick loop,
 * and threshold side-effects (osaekomi auto wazari/ippon).
 */
export function useMatchController(initial: MatchState) {
  const [current, setCurrent] = useState<MatchState>(initial);
  const [past, setPast] = useState<MatchState[]>([]);
  const [nowMs, setNowMs] = useState<number>(() => performance.now());
  const rafRef = useRef<number | null>(null);
  const currentRef = useRef(current);
  currentRef.current = current;

  const dispatch = useCallback((event: MatchEvent) => {
    setCurrent((prev) => {
      const next = matchReducer(prev, event);
      if (next === prev) return prev;
      if (!NON_UNDOABLE.has(event.type)) {
        setPast((p) => [...p.slice(-UNDO_LIMIT + 1), prev]);
      }
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1];
      setCurrent(prev);
      return p.slice(0, -1);
    });
  }, []);

  // Persist
  useEffect(() => {
    saveMatch(current).catch(() => {});
  }, [current]);

  // RAF loop
  useEffect(() => {
    const running = current.clockRunning || !!current.osaekomi.side;
    if (!running) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    const loop = () => {
      const t = performance.now();
      setNowMs(t);
      dispatch({ type: 'CLOCK_TICK', nowMs: t });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [current.clockRunning, current.osaekomi.side, dispatch]);

  // Osaekomi auto-award thresholds
  useEffect(() => {
    const s = currentRef.current;
    if (!s.osaekomi.side) return;
    const sec = liveOsaekomiSec(s, nowMs);
    if (sec >= s.rule.osaekomiIpponSec) {
      dispatch({
        type: 'OSAEKOMI_AUTO_AWARD',
        side: s.osaekomi.side,
        kind: 'ippon',
        at: Date.now(),
      });
      dispatch({ type: 'OSAEKOMI_STOP', at: Date.now(), nowMs: performance.now() });
      return;
    }
    if (!s.osaekomi.wazariAwarded && sec >= s.rule.osaekomiWazariSec) {
      dispatch({
        type: 'OSAEKOMI_AUTO_AWARD',
        side: s.osaekomi.side,
        kind: 'wazari',
        at: Date.now(),
      });
    }
  }, [nowMs, dispatch]);

  const clockSec = liveClockSec(current, nowMs);
  const osaekomiSec = liveOsaekomiSec(current, nowMs);

  return {
    state: current,
    nowMs,
    clockSec,
    osaekomiSec,
    canUndo: past.length > 0,
    dispatch,
    undo,
  };
}
