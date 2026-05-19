# Project Structure

## Directory Layout
```
src/
├── assets/                         # Static assets (logo)
├── components/                     # React components
│   ├── ui/                         # shadcn/ui primitives
│   ├── Clock.tsx                   # Class bell time display
│   ├── Countdown.tsx               # Warning countdown
│   ├── CurrentSectionProgress.tsx  # Progress bar
│   ├── Header.tsx                  # Navigation header (incl. Tournament link)
│   ├── ScheduleEditor.tsx          # Schedule management
│   └── tournament/
│       ├── AthleteRow.tsx          # White/Blue scoreboard row
│       ├── MainClock.tsx           # Big match clock + nudgers
│       ├── OsaekomiChip.tsx        # Osaekomi sub-timer chip
│       ├── ShidoCards.tsx          # Yellow card visuals
│       ├── EndGamePanel.tsx        # "Won by" reason picker
│       ├── MatchControls.tsx       # Undo / Golden / Switch / End / Reset
│       └── KeyboardHelp.tsx        # Shortcut overlay
├── hooks/
│   ├── useScheduleTimer.ts         # Class bell timer logic
│   ├── useMatchController.ts       # Match state + undo + RAF tick
│   ├── useMatchKeyboard.ts         # Operator keyboard shortcuts
│   └── useMatchSync.ts             # BroadcastChannel + localStorage mirror
├── lib/
│   ├── audioSystem.ts              # Web Audio API sounds (shared)
│   ├── scheduleStore.ts            # Class bell IndexedDB store
│   ├── matchStore.ts               # Tournament IndexedDB store
│   ├── matchTypes.ts               # MatchState, MatchEvent, Athlete, ...
│   ├── matchReducer.ts             # Pure reducer + live time helpers + factory
│   ├── matchPresets.ts             # IJF + USA Judo rule presets
│   └── utils.ts                    # Utilities
├── pages/
│   ├── Index.tsx                   # Class bell main page (/)
│   ├── Tournament.tsx              # Operator scoreboard (/tournament)
│   ├── TournamentSetup.tsx         # New match config (/tournament/setup)
│   ├── TournamentDisplay.tsx       # Spectator view (/tournament/display)
│   └── NotFound.tsx
└── index.css                       # Global styles + design tokens
```

## Key Data Models

### Schedule (Class Bell)
```typescript
interface Schedule {
  id: string;
  name: string;
  groupId: string;
  isActive: boolean;
  dayOfWeek?: DayOfWeek;
  classStartTime: string;
  warningBellSound: BellSound;
  endBellSound: BellSound;
  sections: Section[];
}
```

### Section (Class Bell)
```typescript
interface Section {
  id: string;
  name: string;
  durationMinutes: number;
  startTime: string; // Auto-calculated
  endTime: string;   // Auto-calculated
  color: string;
  playEndBell: boolean;
  playTwoMinWarning: boolean;
}
```

### MatchState (Tournament)
```typescript
interface MatchState {
  id: string;
  createdAt: number;
  presetId: string;
  divisionLabel: string;
  rule: RuleConfig;            // durationSec, goldenScoreCapSec, shidoToDq, osaekomi thresholds
  white: Athlete;
  blue: Athlete;
  scores: { white: AthleteScore; blue: AthleteScore };
  phase: 'regulation' | 'golden-score' | 'ended';
  clockSec: number;            // remaining (regulation) or elapsed (golden)
  clockRunning: boolean;
  clockAnchorMs: number | null; // performance.now() anchor while running
  osaekomi: OsaekomiState;
  result: MatchResult | null;
}
```

Match actions flow through a pure `matchReducer(state, event)` so Undo and
(future) audit logs are trivial. Live clock values are derived via
`liveClockSec(state, performance.now())` instead of being persisted on every tick.

## Dependencies
- idb: IndexedDB wrapper
- framer-motion: Animations
- lucide-react: Icons
- sonner: Toast notifications
- react-router-dom: Routing (`/`, `/tournament`, `/tournament/setup`, `/tournament/display`)
