import { Pause, Play, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  seconds: number;
  running: boolean;
  phase: 'regulation' | 'golden-score' | 'ended';
  onToggle: () => void;
  onNudge: (deltaSec: number) => void;
}

function fmt(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export function MainClock({ seconds, running, phase, onToggle, onNudge }: Props) {
  const ended = phase === 'ended';
  const isGolden = phase === 'golden-score';
  const lowTime = phase === 'regulation' && seconds <= 30 && seconds > 0;

  return (
    <div className="flex flex-col items-end gap-2">
      {isGolden && (
        <div className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-warning">
          Golden Score
        </div>
      )}
      <div
        className={cn(
          'font-mono font-bold tabular-nums leading-none',
          'text-6xl md:text-8xl lg:text-9xl',
          ended ? 'text-muted-foreground' : lowTime ? 'text-destructive' : 'text-warning',
        )}
      >
        {fmt(seconds)}
      </div>
      <div className="flex items-center gap-1 md:gap-2">
        <button type="button" onClick={() => onNudge(-30)} className="btn-icon" aria-label="-30s" disabled={ended}>
          <span className="text-xs font-bold">−30</span>
        </button>
        <button type="button" onClick={() => onNudge(-1)} className="btn-icon" aria-label="-1s" disabled={ended}>
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="btn-icon !w-14 !h-14 !bg-primary text-primary-foreground hover:!bg-primary/90"
          aria-label={running ? 'Pause' : 'Start'}
          disabled={ended}
        >
          {running ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </button>
        <button type="button" onClick={() => onNudge(1)} className="btn-icon" aria-label="+1s" disabled={ended}>
          <Plus className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => onNudge(30)} className="btn-icon" aria-label="+30s" disabled={ended}>
          <span className="text-xs font-bold">+30</span>
        </button>
      </div>
    </div>
  );
}
