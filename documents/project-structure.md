# Project Structure

## Directory Layout
```
src/
├── assets/           # Static assets (logo)
├── components/       # React components
│   ├── ui/          # shadcn/ui primitives
│   ├── Clock.tsx    # Main time display
│   ├── Countdown.tsx # Warning countdown
│   ├── CurrentSectionProgress.tsx # Progress bar
│   ├── Header.tsx   # Navigation header
│   └── ScheduleEditor.tsx # Schedule management
├── hooks/
│   └── useScheduleTimer.ts # Timer logic hook
├── lib/
│   ├── audioSystem.ts # Web Audio API sounds
│   ├── scheduleStore.ts # IndexedDB + data models
│   └── utils.ts     # Utilities
├── pages/
│   └── Index.tsx    # Main app page
└── index.css        # Global styles
```

## Key Data Models

### Schedule
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

### Section
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

## Dependencies
- idb: IndexedDB wrapper
- framer-motion: Animations
- lucide-react: Icons
- sonner: Toast notifications
