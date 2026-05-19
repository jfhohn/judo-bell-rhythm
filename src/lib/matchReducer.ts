import {
  AthleteScore,
  MatchEvent,
  MatchState,
  ScoreKind,
  Side,
  WinReason,
} from './matchTypes';

// ----------------- helpers -----------------

const emptyScore = (): AthleteScore => ({ ippon: 0, wazari: 0, shido: 0 });

function other(side: Side): Side {
  return side === 'white' ? 'blue' : 'white';
}

/**
 * Returns the live remaining/elapsed seconds for the visible clock.
 * For regulation phase: counts DOWN from clockSec.
 * For golden score: counts UP from clockSec.
 */
export function liveClockSec(state: MatchState, nowMs: number): number {
  if (!state.clockRunning || state.clockAnchorMs == null) return state.clockSec;
  const elapsed = (nowMs - state.clockAnchorMs) / 1000;
  if (state.phase === 'regulation') {
    return Math.max(0, state.clockSec - elapsed);
  }
  if (state.phase === 'golden-score') {
    if (state.rule.goldenScoreCapSec > 0) {
      return Math.min(state.rule.goldenScoreCapSec, state.clockSec + elapsed);
    }
    return state.clockSec + elapsed;
  }
  return state.clockSec;
}

export function liveOsaekomiSec(state: MatchState, nowMs: number): number {
  const o = state.osaekomi;
  if (o.side && o.startedAtMs != null) {
    return o.frozenSec + (nowMs - o.startedAtMs) / 1000;
  }
  return o.frozenSec;
}

/** Check terminating conditions; returns null or {winner, reason}. */
export function evaluateAutoWin(
  state: MatchState,
): { winner: Side; reason: WinReason } | null {
  for (const side of ['white', 'blue'] as Side[]) {
    const s = state.scores[side];
    if (s.ippon >= 1) return { winner: side, reason: 'ippon' };
    if (s.wazari >= 2) return { winner: side, reason: 'ippon' }; // wazari-awasete-ippon
    const opp = state.scores[other(side)];
    if (opp.shido >= state.rule.shidoToDq) return { winner: side, reason: 'hansokumake' };
  }
  return null;
}

// ----------------- reducer -----------------

export function matchReducer(state: MatchState, event: MatchEvent): MatchState {
  switch (event.type) {
    case 'SCORE_ADD': {
      if (state.phase === 'ended') return state;
      const next: MatchState = {
        ...state,
        scores: {
          ...state.scores,
          [event.side]: {
            ...state.scores[event.side],
            [event.kind]: state.scores[event.side][event.kind] + 1,
          },
        },
      };
      const auto = evaluateAutoWin(next);
      if (auto) {
        return endMatch(next, auto.winner, auto.reason, event.at);
      }
      return next;
    }

    case 'SCORE_REMOVE': {
      const current = state.scores[event.side][event.kind];
      if (current <= 0) return state;
      return {
        ...state,
        scores: {
          ...state.scores,
          [event.side]: {
            ...state.scores[event.side],
            [event.kind]: current - 1,
          },
        },
      };
    }

    case 'CLOCK_START': {
      if (state.phase === 'ended' || state.clockRunning) return state;
      if (state.osaekomi.side) return state; // can't start main during osaekomi
      return { ...state, clockRunning: true, clockAnchorMs: event.nowMs };
    }

    case 'CLOCK_PAUSE': {
      if (!state.clockRunning) return state;
      return commitClock(state, event.nowMs);
    }

    case 'CLOCK_NUDGE': {
      if (state.phase === 'ended') return state;
      // Always commit first so anchor is current
      const committed = state.clockRunning && state.clockAnchorMs != null
        ? commitClock(state, performance.now())
        : state;
      let newSec = committed.clockSec + event.deltaSec;
      if (committed.phase === 'regulation') {
        newSec = Math.max(0, Math.min(committed.rule.durationSec * 2, newSec));
      } else {
        newSec = Math.max(0, newSec);
      }
      const next = { ...committed, clockSec: newSec };
      // If we were running, restart anchor at now
      if (state.clockRunning) {
        return { ...next, clockRunning: true, clockAnchorMs: performance.now() };
      }
      return next;
    }

    case 'CLOCK_TICK': {
      // Called by timer; checks regulation expiry. Does NOT auto-enter golden score.
      if (!state.clockRunning || state.phase === 'ended') return state;
      const live = liveClockSec(state, event.nowMs);
      if (state.phase === 'regulation' && live <= 0) {
        // freeze at 0, pause
        return { ...state, clockSec: 0, clockRunning: false, clockAnchorMs: null };
      }
      if (
        state.phase === 'golden-score' &&
        state.rule.goldenScoreCapSec > 0 &&
        live >= state.rule.goldenScoreCapSec
      ) {
        return {
          ...state,
          clockSec: state.rule.goldenScoreCapSec,
          clockRunning: false,
          clockAnchorMs: null,
        };
      }
      return state;
    }

    case 'OSAEKOMI_START': {
      if (state.phase === 'ended') return state;
      if (state.osaekomi.side) return state;
      // pause main clock
      const paused = state.clockRunning ? commitClock(state, event.nowMs) : state;
      return {
        ...paused,
        osaekomi: { side: event.side, startedAtMs: event.nowMs, frozenSec: 0, wazariAwarded: false },
      };
    }

    case 'OSAEKOMI_STOP': {
      const o = state.osaekomi;
      if (!o.side) return state;
      const total = liveOsaekomiSec(state, event.nowMs);
      return {
        ...state,
        osaekomi: { side: null, startedAtMs: null, frozenSec: 0, wazariAwarded: false },
        // intentionally don't auto-restart main clock; operator decides
        clockRunning: false,
        clockAnchorMs: null,
        // store the elapsed for the auto-award caller (via separate event)
        ...(total ? {} : {}),
      };
    }

    case 'OSAEKOMI_AUTO_AWARD': {
      // award and (if ippon) end match
      const next = matchReducer(state, {
        type: 'SCORE_ADD',
        side: event.side,
        kind: event.kind,
        at: event.at,
      });
      return next;
    }

    case 'ENTER_GOLDEN_SCORE': {
      if (state.phase !== 'regulation') return state;
      return {
        ...state,
        phase: 'golden-score',
        clockSec: 0,
        clockRunning: false,
        clockAnchorMs: null,
      };
    }

    case 'SWITCH_SIDES': {
      if (state.osaekomi.side) return state; // refuse mid-osaekomi
      return {
        ...state,
        white: state.blue,
        blue: state.white,
        scores: { white: state.scores.blue, blue: state.scores.white },
      };
    }

    case 'END_MATCH': {
      return endMatch(state, event.winner, event.reason, event.at);
    }

    case 'RESET_MATCH': {
      return {
        ...state,
        scores: { white: emptyScore(), blue: emptyScore() },
        phase: 'regulation',
        clockSec: state.rule.durationSec,
        clockRunning: false,
        clockAnchorMs: null,
        osaekomi: { side: null, startedAtMs: null, frozenSec: 0, wazariAwarded: false },
        result: null,
      };
    }

    default:
      return state;
  }
}

function commitClock(state: MatchState, nowMs: number): MatchState {
  const live = liveClockSec(state, nowMs);
  return { ...state, clockSec: live, clockRunning: false, clockAnchorMs: null };
}

function endMatch(
  state: MatchState,
  winner: Side | 'draw' | 'double',
  reason: WinReason,
  at: number,
): MatchState {
  const frozen = state.clockRunning ? commitClock(state, performance.now()) : state;
  return {
    ...frozen,
    phase: 'ended',
    clockRunning: false,
    clockAnchorMs: null,
    osaekomi: { side: null, startedAtMs: null, frozenSec: 0, wazariAwarded: false },
    result: { winner, reason, endedAt: at },
  };
}

// ----------------- factory -----------------

export function createMatchState(args: {
  presetId: string;
  rule: import('./matchTypes').RuleConfig;
  white: import('./matchTypes').Athlete;
  blue: import('./matchTypes').Athlete;
  divisionLabel: string;
}): MatchState {
  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    presetId: args.presetId,
    divisionLabel: args.divisionLabel,
    rule: args.rule,
    white: args.white,
    blue: args.blue,
    scores: { white: emptyScore(), blue: emptyScore() },
    phase: 'regulation',
    clockSec: args.rule.durationSec,
    clockRunning: false,
    clockAnchorMs: null,
    osaekomi: { side: null, startedAtMs: null, frozenSec: 0, wazariAwarded: false },
    result: null,
  };
}
