import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MatchState, ScoreKind, Side, WinReason } from '@/lib/matchTypes';
import { createMatchState, evaluateAutoWin } from '@/lib/matchReducer';
import { getPreset, DEFAULT_PRESET_ID } from '@/lib/matchPresets';
import { loadLastMatch } from '@/lib/matchStore';
import { useMatchController } from '@/hooks/useMatchController';
import { useMatchKeyboard } from '@/hooks/useMatchKeyboard';
import { useBroadcastMatch } from '@/hooks/useMatchSync';
import { audioSystem } from '@/lib/audioSystem';
import { AthleteRow } from '@/components/tournament/AthleteRow';
import { MainClock } from '@/components/tournament/MainClock';
import { MatchControls } from '@/components/tournament/MatchControls';
import { EndGamePanel } from '@/components/tournament/EndGamePanel';
import { KeyboardHelp } from '@/components/tournament/KeyboardHelp';
import { ExternalLink, Trophy } from 'lucide-react';

function buildFreshState() {
  const preset = getPreset(DEFAULT_PRESET_ID);
  return createMatchState({
    presetId: preset.id,
    rule: preset.rule,
    white: { name: '', country: '', club: '' },
    blue:  { name: '', country: '', club: '' },
    divisionLabel: '',
  });
}

export default function Tournament() {
  const navigate = useNavigate();
  const [initial, setInitial] = useState<MatchState | null>(null);

  useEffect(() => {
    loadLastMatch().then((m) => setInitial(m ?? buildFreshState()));
  }, []);

  if (!initial) {
    return <div className="min-h-screen bg-scoreboard flex items-center justify-center text-foreground">Loading…</div>;
  }
  return <TournamentInner key={initial.id} initial={initial} navigate={navigate} />;
}

function TournamentInner({
  initial,
  navigate,
}: {
  initial: MatchState;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const { state, clockSec, osaekomiSec, canUndo, dispatch, undo } = useMatchController(initial);
  const [showEnd, setShowEnd] = useState(false);
  const [endPickSide, setEndPickSide] = useState<Side | null>(null);
  const [showKeys, setShowKeys] = useState(false);

  useBroadcastMatch(state);

  // End-of-regulation buzzer
  const [buzzed, setBuzzed] = useState<string | null>(null);
  useEffect(() => {
    if (state.phase === 'regulation' && !state.clockRunning && clockSec <= 0) {
      const key = `regend-${state.id}`;
      if (buzzed !== key) {
        setBuzzed(key);
        audioSystem.playBell('boxing').catch(() => {});
      }
    }
    if (state.phase === 'ended') {
      const key = `end-${state.id}`;
      if (buzzed !== key) {
        setBuzzed(key);
        audioSystem.playBell('boxing').catch(() => {});
      }
    }
  }, [state.phase, state.clockRunning, clockSec, state.id, buzzed]);

  // Click-to-enable audio
  useEffect(() => {
    const fn = () => audioSystem.resume().catch(() => {});
    window.addEventListener('click', fn, { once: true });
    return () => window.removeEventListener('click', fn);
  }, []);

  // Actions ----------------------------------------------------------------
  const toggleClock = useCallback(() => {
    if (state.phase === 'ended') return;
    const at = Date.now();
    const nowMs = performance.now();
    if (state.clockRunning) dispatch({ type: 'CLOCK_PAUSE', at, nowMs });
    else dispatch({ type: 'CLOCK_START', at, nowMs });
  }, [state.clockRunning, state.phase, dispatch]);

  const nudge = useCallback(
    (deltaSec: number) => dispatch({ type: 'CLOCK_NUDGE', deltaSec, at: Date.now() }),
    [dispatch],
  );

  const score = useCallback(
    (side: Side, kind: ScoreKind, delta: 1 | -1) =>
      dispatch({
        type: delta === 1 ? 'SCORE_ADD' : 'SCORE_REMOVE',
        side,
        kind,
        at: Date.now(),
      }),
    [dispatch],
  );

  const toggleOsaekomi = useCallback(
    (side: Side) => {
      const at = Date.now();
      const nowMs = performance.now();
      if (state.osaekomi.side === side) {
        dispatch({ type: 'OSAEKOMI_STOP', at, nowMs });
      } else if (!state.osaekomi.side) {
        dispatch({ type: 'OSAEKOMI_START', side, at, nowMs });
      } else {
        // currently on the other side → stop, then start new
        dispatch({ type: 'OSAEKOMI_STOP', at, nowMs });
        setTimeout(() => dispatch({ type: 'OSAEKOMI_START', side, at, nowMs: performance.now() }), 0);
      }
    },
    [state.osaekomi.side, dispatch],
  );

  const onGoldenScore = () => dispatch({ type: 'ENTER_GOLDEN_SCORE', at: Date.now() });
  const onSwitchSides = () => dispatch({ type: 'SWITCH_SIDES', at: Date.now() });
  const onReset = () => {
    if (state.phase !== 'ended' && !confirm('Reset match?')) return;
    dispatch({ type: 'RESET_MATCH', at: Date.now() });
  };

  // End-game pre-pick: if there's already a clear winner, suggest it
  const openEnd = () => {
    const auto = evaluateAutoWin(state);
    setEndPickSide(auto ? auto.winner : null);
    setShowEnd(true);
  };
  const confirmEnd = (winner: Side | 'draw' | 'double', reason: WinReason) => {
    dispatch({ type: 'END_MATCH', winner, reason, at: Date.now() });
    setShowEnd(false);
  };

  // Keyboard ---------------------------------------------------------------
  useMatchKeyboard(
    useCallback(
      (e) => {
        const k = e.key;
        const shift = e.shiftKey;
        const map: Record<string, () => void> = {
          ' ': toggleClock,
          q: () => score('white', 'ippon', shift ? -1 : 1),
          w: () => score('white', 'wazari', shift ? -1 : 1),
          e: () => score('white', 'shido', shift ? -1 : 1),
          a: () => score('blue', 'ippon', shift ? -1 : 1),
          s: () => score('blue', 'wazari', shift ? -1 : 1),
          d: () => score('blue', 'shido', shift ? -1 : 1),
          o: () => toggleOsaekomi('white'),
          k: () => toggleOsaekomi('blue'),
          u: undo,
          x: onSwitchSides,
          g: onGoldenScore,
          Enter: openEnd,
          '?': () => setShowKeys(true),
          ArrowLeft: () => nudge(shift ? -30 : -1),
          ArrowRight: () => nudge(shift ? 30 : 1),
        };
        const fn = map[k] ?? map[k.toLowerCase()];
        if (fn) {
          e.preventDefault();
          fn();
        }
      },
      [toggleClock, score, toggleOsaekomi, undo, nudge, state.phase],
    ),
    !showEnd && !showKeys,
  );

  const popDisplay = () => {
    window.open('/tournament/display', '_blank', 'noopener,width=1280,height=720');
  };

  return (
    <div className="min-h-screen bg-scoreboard text-foreground p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-muted-foreground hover:text-foreground uppercase tracking-widest"
            >
              ← Class Bell
            </button>
            <div className="flex items-center gap-2 text-warning">
              <Trophy className="w-5 h-5" />
              <span className="font-bold uppercase tracking-widest text-sm">Tournament</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/tournament/setup')}
              className="text-xs px-3 py-2 rounded-md bg-secondary hover:bg-secondary/80 uppercase tracking-wider font-semibold"
            >
              New Match Setup
            </button>
            <button
              onClick={popDisplay}
              className="text-xs px-3 py-2 rounded-md bg-secondary hover:bg-secondary/80 uppercase tracking-wider font-semibold inline-flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" /> Pop-out display
            </button>
          </div>
        </div>

        {/* Athletes */}
        <AthleteRow
          side="white"
          athlete={state.white}
          score={state.scores.white}
          osaekomiActive={state.osaekomi.side === 'white'}
          osaekomiSec={state.osaekomi.side === 'white' ? osaekomiSec : 0}
          onAthleteChange={(a) => dispatch({ type: 'SCORE_ADD', side: 'white', kind: 'shido', at: -1 }) /* placeholder; replaced below */}
          onScore={(kind, delta) => score('white', kind, delta)}
          onOsaekomiToggle={() => toggleOsaekomi('white')}
          disabled={state.phase === 'ended'}
        />
        <AthleteRow
          side="blue"
          athlete={state.blue}
          score={state.scores.blue}
          osaekomiActive={state.osaekomi.side === 'blue'}
          osaekomiSec={state.osaekomi.side === 'blue' ? osaekomiSec : 0}
          onAthleteChange={(a) => dispatch({ type: 'SCORE_ADD', side: 'blue', kind: 'shido', at: -1 }) /* placeholder */}
          onScore={(kind, delta) => score('blue', kind, delta)}
          onOsaekomiToggle={() => toggleOsaekomi('blue')}
          disabled={state.phase === 'ended'}
        />

        {/* Footer panel */}
        <div className="rounded-2xl bg-card p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-widest text-warning font-semibold">
              {state.phase === 'ended'
                ? `Final · ${state.result?.reason.replace(/-/g, ' ')} · ${labelWinner(state)}`
                : state.phase === 'golden-score'
                  ? 'Golden Score'
                  : 'In Match'}
            </div>
            <div className="text-lg md:text-xl font-bold mt-1 truncate">
              {state.divisionLabel || 'Mock match'}
            </div>
            <div className="mt-3">
              <MatchControls
                canUndo={canUndo}
                phase={state.phase}
                onUndo={undo}
                onSwitchSides={onSwitchSides}
                onGoldenScore={onGoldenScore}
                onEndMatch={openEnd}
                onReset={onReset}
                onShowKeys={() => setShowKeys(true)}
              />
            </div>
          </div>
          <MainClock
            seconds={clockSec}
            running={state.clockRunning}
            phase={state.phase}
            onToggle={toggleClock}
            onNudge={nudge}
          />
        </div>
      </div>

      {showEnd && (
        <EndGamePanel
          pickingSide={endPickSide}
          onSelect={confirmEnd}
          onCancel={() => setShowEnd(false)}
        />
      )}
      {showKeys && <KeyboardHelp onClose={() => setShowKeys(false)} />}
    </div>
  );
}

function labelWinner(state: MatchState): string {
  const w = state.result?.winner;
  if (!w) return '';
  if (w === 'draw') return 'Draw';
  if (w === 'double') return 'No result';
  const a = w === 'white' ? state.white : state.blue;
  return a.name ? a.name.toUpperCase() : (w === 'white' ? 'White' : 'Blue');
}
