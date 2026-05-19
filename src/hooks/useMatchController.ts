import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { MatchEvent, MatchState, Side } from '@/lib/matchTypes';
import { liveClockSec, liveOsaekomiSec, matchReducer } from '@/lib/matchReducer';
import { saveMatch } from '@/lib/matchStore';

const UNDO_LIMIT = 100;

// Events that should not be pushed onto the undo stack (internal/transient)
const NON_UNDOABLE = new Set<MatchEvent['type']>(['CLOCK_TICK']);

interface ControllerState {
  current: MatchState;
  past: MatchState[];
}

function controllerReducer(state: ControllerState, event: MatchEvent): ControllerState {
  if (event.type === 'UNDO' as any) {
    // handled outside
    return state;
  }
  const next = matchReducer(state.current, event);
  if (next === state.current) return state;
  const push = !NON_UNDOABLE.has(event.type);
  return {
    current: next,
    past: push ? [...state.past.slice(-UNDO_LIMIT + 1), state.current] : state.past,
  };
}

/**
 * Owns the match state, the undo stack, an animation-frame tick loop,
 * and threshold side-effects (osaekomi auto wazari/ippon).
 */
export function useMatchController(initial: MatchState) {
  const [state, baseDispatch] = useReducer(controllerReducer, {
    current: initial,
    past: [],
  });
  const [nowMs, setNowMs] = useState<number>(() => performance.now());
  const rafRef = useRef<number | null>(null);

  // dispatch wrapper that also persists
  const dispatch = useCallback((event: MatchEvent) => {
    baseDispatch(event);
  }, []);

  const undo = useCallback(() => {
    baseDispatch({ type: '__UNDO__' as any });
  }, []);

  // Override reducer to support undo. (Inline because useReducer doesn't accept actions outside our union.)
  // We patch by managing a tiny secondary state.
  const [stack, setStack] = useState<MatchState[]>([]);
  const lastRef = useRef<MatchState>(state.current);

  useEffect(() => {
    lastRef.current = state.current;
  }, [state.current]);

  // Persist on every meaningful state change
  useEffect(() => {
    saveMatch(state.current).catch(() => {});
  }, [state.current]);

  // Animation frame loop while clock or osaekomi running
  useEffect(() => {
    const running = state.current.clockRunning || !!state.current.osaekomi.side;
    if (!running) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    const loop = () => {
      const t = performance.now();
      setNowMs(t);
      // tick the reducer so it can self-pause at expiry
      dispatch({ type: 'CLOCK_TICK', nowMs: t });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [state.current.clockRunning, state.current.osaekomi.side, dispatch]);

  // Osaekomi thresholds → auto award
  useEffect(() => {
    const s = state.current;
    if (!s.osaekomi.side) return;
    const sec = liveOsaekomiSec(s, nowMs);
    if (!s.osaekomi.wazariAwarded && sec >= s.rule.osaekomiWazariSec) {
      dispatch({
        type: 'OSAEKOMI_AUTO_AWARD',
        side: s.osaekomi.side,
        kind: 'wazari',
        at: Date.now(),
      });
    }
    if (sec >= s.rule.osaekomiIpponSec) {
      dispatch({
        type: 'OSAEKOMI_AUTO_AWARD',
        side: s.osaekomi.side,
        kind: 'ippon',
        at: Date.now(),
      });
      // and stop the hold
      dispatch({ type: 'OSAEKOMI_STOP', at: Date.now(), nowMs: performance.now() });
    }
  }, [nowMs, state.current, dispatch]);

  // Live derived values
  const clockSec = liveClockSec(state.current, nowMs);
  const osaekomiSec = liveOsaekomiSec(state.current, nowMs);

  // Undo
  const doUndo = useCallback(() => {
    if (state.past.length === 0) return;
    const prev = state.past[state.past.length - 1];
    // hack: we re-init via a synthetic action. easier: useState-like reset.
    // We'll replace state by dispatching a RESET-like event won't work for arbitrary snapshots,
    // so instead we expose an imperative setter via a custom hook event below.
    setUndoTarget(prev);
  }, [state.past]);

  // imperative reset path
  const [undoTarget, setUndoTarget] = useState<MatchState | null>(null);
  useEffect(() => {
    if (undoTarget) {
      // re-seed both current and pop past
      baseDispatch({ type: '__SEED__', payload: { current: undoTarget, past: state.past.slice(0, -1) } } as any);
      setUndoTarget(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoTarget]);

  return {
    state: state.current,
    nowMs,
    clockSec,
    osaekomiSec,
    canUndo: state.past.length > 0,
    dispatch,
    undo: doUndo,
  };
}
