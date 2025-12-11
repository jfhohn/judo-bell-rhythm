# Judo SchoolBell - Product Requirements Document

## Product Vision
A purpose-built class timer application for Silicon Valley Judo instructors, eliminating timing distractions during martial arts instruction.

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
- Multiple bell sounds (Classic, School, Gong, Chime)
- Per-section audio configuration
- 5-minute and 2-minute warnings

### Visual Display
- Large, distance-readable clock (12-hour format)
- Red flashing in final 2 minutes
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
