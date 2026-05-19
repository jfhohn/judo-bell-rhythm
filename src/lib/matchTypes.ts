// Tournament match domain types

export type Side = 'white' | 'blue';

export interface Athlete {
  name: string;
  country: string; // 3-letter code like "JPN"
  club: string;
}

export type ScoreKind = 'ippon' | 'wazari' | 'shido';

export type WinReason =
  | 'ippon'
  | 'wazari'
  | 'walkover'
  | 'hansokumake'
  | 'no-show'
  | 'decision'
  | 'draw'
  | 'double-wo-dq'
  | 'double-no-show';

export interface MatchResult {
  winner: Side | 'draw' | 'double';
  reason: WinReason;
  endedAt: number; // epoch ms
}

export interface AthleteScore {
  ippon: number;
  wazari: number;
  shido: number;
}

export type Phase = 'regulation' | 'golden-score' | 'ended';

export interface RuleConfig {
  /** match duration in seconds (regulation) */
  durationSec: number;
  /** golden-score cap in seconds; 0 = unlimited */
  goldenScoreCapSec: number;
  /** shidos required to lose by penalty */
  shidoToDq: number;
  /** osaekomi seconds for wazari */
  osaekomiWazariSec: number;
  /** osaekomi seconds for ippon */
  osaekomiIpponSec: number;
}

export interface OsaekomiState {
  side: Side | null;
  startedAtMs: number | null; // performance.now() anchor
  /** seconds already accumulated and frozen (e.g. after stop) */
  frozenSec: number;
}

export interface MatchState {
  id: string;
  createdAt: number;
  presetId: string;
  divisionLabel: string; // e.g. "Senior / -73 KG"
  rule: RuleConfig;

  white: Athlete;
  blue: Athlete;
  scores: { white: AthleteScore; blue: AthleteScore };

  phase: Phase;

  /** regulation: seconds remaining. golden-score: seconds elapsed. */
  clockSec: number;
  clockRunning: boolean;
  /** performance.now() anchor when clock last started; null if paused */
  clockAnchorMs: number | null;

  osaekomi: OsaekomiState;

  result: MatchResult | null;
}

// Event log for the reducer (powers undo + audit)
export type MatchEvent =
  | { type: 'SCORE_ADD'; side: Side; kind: ScoreKind; at: number }
  | { type: 'SCORE_REMOVE'; side: Side; kind: ScoreKind; at: number }
  | { type: 'CLOCK_START'; at: number; nowMs: number }
  | { type: 'CLOCK_PAUSE'; at: number; nowMs: number }
  | { type: 'CLOCK_NUDGE'; deltaSec: number; at: number }
  | { type: 'CLOCK_TICK'; nowMs: number } // not undoable; not pushed
  | { type: 'OSAEKOMI_START'; side: Side; at: number; nowMs: number }
  | { type: 'OSAEKOMI_STOP'; at: number; nowMs: number }
  | { type: 'OSAEKOMI_AUTO_AWARD'; side: Side; kind: 'wazari' | 'ippon'; at: number }
  | { type: 'ENTER_GOLDEN_SCORE'; at: number }
  | { type: 'SWITCH_SIDES'; at: number }
  | { type: 'END_MATCH'; reason: WinReason; winner: Side | 'draw' | 'double'; at: number }
  | { type: 'RESET_MATCH'; at: number };
