import { useEffect } from 'react';
import { MatchState } from '@/lib/matchTypes';

const CHANNEL = 'judo-match';
const KEY = 'judo-match:state';

/** Operator side: broadcast current state on every change. */
export function useBroadcastMatch(state: MatchState) {
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
    const bc = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL) : null;
    bc?.postMessage(state);
    bc?.close();
  }, [state]);
}

/** Display side: subscribe to operator broadcasts and to localStorage seed. */
export function useSubscribeMatch(setState: (s: MatchState) => void) {
  useEffect(() => {
    // seed from localStorage
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}

    const bc = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL) : null;
    if (bc) {
      bc.onmessage = (e) => setState(e.data as MatchState);
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) {
        try { setState(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      bc?.close();
      window.removeEventListener('storage', onStorage);
    };
  }, [setState]);
}
