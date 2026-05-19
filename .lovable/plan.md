
# Tournament Match Timer — Phase 1 Plan

## Goal

Add a new section to the app at `/tournament` that gives a dojo a faithful Smoothcomp-style scoreboard for mock matches. The existing class-bell app at `/` is untouched. All work happens on the `tournament-timer` branch; you only Publish when v1 feels solid.

Phase 2 (tournament organizer software — brackets, fightorder, mat assignments, registration) is explicitly out of scope here. We'll set up data shapes that can grow into it without rework.

## Scope (what ships in v1)

**Operator console (`/tournament`)**
- Two athlete rows: White (top), Blue (bottom). Inline-editable name, country (3-letter code), club.
- Per-athlete: `+ IPPON`, `+ WAZARI`, `+ SHIDO` and their `−` counterparts. Shido cards render as yellow card chips (1, 2, 3=disqualification).
- Per-athlete Osaekomi sub-timer (00:00 chip). Starting osaekomi pauses the main clock and counts up; auto-Wazari at 10s, auto-Ippon at 20s (IJF). Stop/reset on release.
- Main match clock: large MM:SS, configurable duration. Start/Pause toggle, ±1s and ±30s nudgers (matches the recording).
- Golden Score: when regulation expires with a tie, "Go to Golden Score" puts the clock into count-**up** mode from 00:00; first score or shido-DQ ends the match.
- End-game flow: "End Game" reveals a "Won by:" panel — Ippon, Wazari, Walkover, Hansokumake, No Show, Decision, Draw, Double WO/DQ, Double No Show — same grid as Smoothcomp. Selecting a reason locks the result.
- Undo last scoring action (stack-based, unlimited within current match).
- Switch Sides (swap White ↔ Blue including scores, names, osaekomi state).
- "Back" controls present but stubbed for Phase 2: "Back to Bracket" and "Back to Fightorder" are visible/disabled with a tooltip "Coming in tournament mode."
- End-of-match buzzer reuses `src/lib/audioSystem.ts`.

**Keyboard shortcuts** (shown in a `?` help overlay)
- `Space` start/pause main clock
- `O` / `K` start/stop White / Blue osaekomi
- `Q W E` White +Ippon / +Wazari / +Shido
- `A S D` Blue +Ippon / +Wazari / +Shido
- `Shift` + above = decrement
- `U` undo, `X` switch sides, `G` enter golden score, `Enter` end game

**Rule presets**
- IJF: Senior 4:00, Junior 4:00, Cadet 4:00, Veteran 3:00. Win on Ippon, 2× Wazari (Wazari-awasete-Ippon), or opponent reaches 3 Shido.
- USA Judo youth: Bantam 2:00, Intermediate 3:00, Juvenile 3:00, plus the IJF tiers above.
- Custom: operator overrides match duration, golden-score cap (or unlimited), shido-to-DQ count, osaekomi Wazari/Ippon thresholds.
- Preset picker on a "New Match" screen; values can be edited per match without changing the preset.

**Referee / Spectator view (`/tournament/display`)**
- Read-only big-screen render of the same match: large clock, scores, names, shido cards, osaekomi sub-timer, "FINAL" / "GOLDEN SCORE" banner.
- Synced from the operator tab via `BroadcastChannel('judo-match')` — same browser, no backend. Pop-out button on operator console opens it in a new window for projector/second screen.
- Match state also mirrored to `localStorage` so the display survives a refresh.

**Navigation**
- Add a "Tournament" link in the existing `Header`. Class-bell home route stays default.
- `/tournament` operator, `/tournament/display` spectator, `/tournament/setup` new-match config.

## Out of scope (Phase 2+)

Brackets, fightorder, competitor database, mat assignments, registration/payments, networked multi-mat scoreboards, video review, official results export. Data shapes leave room for these but no UI ships.

## Technical Details

**New files**
```
src/pages/Tournament.tsx               operator console
src/pages/TournamentDisplay.tsx        referee/spectator view
src/pages/TournamentSetup.tsx          new-match config (preset + overrides)
src/components/tournament/
  AthleteRow.tsx                       white or blue row w/ name/score/buttons
  MainClock.tsx                        big MM:SS + nudgers
  OsaekomiChip.tsx                     per-athlete osaekomi sub-timer
  ShidoCards.tsx                       yellow-card visual
  EndGamePanel.tsx                     "Won by:" reason grid
  MatchControls.tsx                    golden score / undo / switch / end / back
  KeyboardHelp.tsx                     shortcut overlay
src/hooks/
  useMatchTimer.ts                     main + golden-score + osaekomi tick logic
  useMatchKeyboard.ts                  shortcut bindings
  useMatchSync.ts                      BroadcastChannel + localStorage mirror
src/lib/
  matchStore.ts                        IndexedDB store for presets & last match
  matchPresets.ts                      IJF + USA Judo preset definitions
  matchTypes.ts                        Match, Athlete, ScoreEvent, MatchResult types
  matchReducer.ts                      pure reducer; every UI action goes through it (powers undo)
```

**State model (reducer + event log)**
- Single `MatchState` updated by `matchReducer(state, event)`. Events: `SCORE_ADD`, `SCORE_REMOVE`, `OSAEKOMI_START/STOP`, `CLOCK_START/PAUSE/NUDGE`, `ENTER_GOLDEN_SCORE`, `SWITCH_SIDES`, `END_MATCH`, `UNDO`.
- Event log enables clean Undo and gives Phase 2 a built-in audit trail.

**Timer accuracy**
- `useMatchTimer` uses `performance.now()` deltas with a `requestAnimationFrame` loop for the visible clock and a separate `setTimeout` chain anchored to wall-clock for buzzer/auto-Wazari/auto-Ippon triggers (same pattern lesson learned from the class-bell drift work).

**Sync**
- Operator broadcasts `MatchState` on every reducer commit. Display tab subscribes, renders read-only. `localStorage` write on every commit so a refreshed display reattaches without losing state.

**Reuse**
- `audioSystem.ts` for buzzer.
- Existing Tailwind tokens / `glass-panel` / button variants — no new design tokens needed except a white-vs-blue athlete background pair (added as HSL semantic tokens in `index.css`).
- `idb` store pattern from `scheduleStore.ts` mirrored in `matchStore.ts`.

## Build order (suggested commits)

1. Types + reducer + presets + unit-ish sanity checks (no UI yet).
2. `/tournament/setup` page → choose preset, override durations, names, start match.
3. `/tournament` operator console — main clock, scores, shido, osaekomi, end-game panel.
4. Keyboard shortcuts + help overlay.
5. `/tournament/display` referee view + BroadcastChannel sync + pop-out.
6. Header nav link, polish, buzzer wiring, README + docs update.

## Docs to update at the end

- `documents/PRD.md` — add "Tournament Match Timer" feature section.
- `documents/roadmap.md` — move tournament timer items from planned to completed; add Phase 2 stubs (brackets, fightorder, mat assignments).
- `documents/project-structure.md` — add new files and the `Match` data model.
- `documents/changelog.md` — entry for v1 ship.

Approve this and switch to build mode and I'll start with step 1 on the `tournament-timer` branch.
