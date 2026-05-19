# Judo SchoolBell - Product Requirements Document

## Product Vision

A purpose-built class manager and timer application for Silicon Valley Judo instructors, eliminating timing distractions during martial arts instruction.

## Problem Statement

Judo instructors need to track multiple class sections (warmup, newaza, tachiwaza, randori) but constantly checking clocks disrupts teaching flow. Existing timer apps require manual intervention and don't support the structured schedule format needed for judo classes.

## Target Users

- **Primary**: SVJ instructors running structured judo classes
- **Secondary**: Students benefiting from consistent, predictable class timing

## Core Features

### Automatic Timer Operation

- Zero manual intervention after startup
- Sections run on schedule automatically
- No pause/override functionality by design

### Schedule Management

- Multiple schedule groups (Standard, Tournament, etc.)
- Day-of-week assignment for auto-loading
- Active schedule designation
- Duration-based time entry with auto-calculation

### Audio System

- Differentiated warning vs end bells
- Multiple bell sounds (Classic, School, Gong, Chime, Boxing, Loud School Bell)
- Per-schedule bell configuration (warning bell + end bell)
- 2-minute audio warning (configurable)
- 5-minute visual-only warning

### Visual Display

- Large, distance-readable clock (12-hour format)
- Red flashing in final 2 minutes
- 5-minute countdown display
- Current section progress bar
- Section color indicators

## Tech Stack

- React + TypeScript + Vite
- IndexedDB for offline persistence
- Web Audio API for synthesized sounds
- Tailwind CSS + Framer Motion
- shadcn/ui components

## Design Principles

- Offline-first architecture
- Distance-optimized visibility
- Zero-distraction operation
- SVJ brand consistency

---

## Tournament Match Timer (Phase 1)

### Problem
Local judo tournaments pay exorbitant fees for industry-standard tournament software (Smoothcomp). Individual dojos also need a faithful Smoothcomp-style scoreboard for in-house mock matches, refereeing practice, and intra-dojo competition — without having to log into commercial tournament software.

### Goal (Phase 1)
Ship a free, browser-based scoreboard that any dojo can use for mock matches and unofficial events. Phase 2 will add tournament-organizer features (brackets, fightorder, mat assignments). Phase 1 deliberately scopes to a single-match operator console.

### Users
- **Operator / Instructor** — drives the scoreboard from a laptop/tablet using click + keyboard shortcuts.
- **Referee / Spectators** — view the read-only big-screen mirror.

### Routes
- `/tournament` — operator console (default match loaded from IndexedDB)
- `/tournament/setup` — choose preset + override timings + name athletes
- `/tournament/display` — read-only spectator/referee view, synced via BroadcastChannel

### Functional Requirements
- Main match clock with start/pause and ±1s / ±30s manual nudgers
- Per-athlete Ippon / Wazari / Shido add and remove
- Osaekomi sub-timer (auto-Wazari and auto-Ippon at configurable thresholds)
- Golden Score mode (count-up clock with optional cap)
- End-of-match "Won by" reason picker (matches Smoothcomp's terminal-result grid)
- Undo for every operator action; Switch Sides; New Match reset
- End-of-regulation and end-of-match buzzer
- Operator-only keyboard shortcuts with on-screen help

### Rule Presets
- **IJF**: Senior 4:00, Junior 4:00, Cadet 4:00, Veteran 3:00 — win on Ippon, 2× Wazari, or opponent reaches 3 Shido.
- **USA Judo**: Bantam 2:00, Intermediate 3:00, Juvenile 3:00, plus IJF presets.
- **Custom**: every duration and threshold editable per match.

### Non-Goals (Phase 1)
Brackets, fightorder, competitor database, mat assignments, registration, networked multi-mat sync, video review, official points export. Data shapes accommodate these for Phase 2.

### Architecture
Single pure `matchReducer(state, event)` drives every state change. The controller hook (`useMatchController`) owns the event/undo stack and runs a `requestAnimationFrame` loop while the clock or osaekomi is active. Live time is derived from `performance.now()` deltas so the displayed clock does not drift even when the tab is throttled. All persistence is local-first via IndexedDB and `BroadcastChannel` for spectator sync — no backend.
