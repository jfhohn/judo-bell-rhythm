import { Undo2, ArrowLeftRight, Trophy, Square, Keyboard, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  canUndo: boolean;
  phase: 'regulation' | 'golden-score' | 'ended';
  onUndo: () => void;
  onSwitchSides: () => void;
  onGoldenScore: () => void;
  onEndMatch: () => void;
  onReset: () => void;
  onShowKeys: () => void;
}

export function MatchControls({
  canUndo,
  phase,
  onUndo,
  onSwitchSides,
  onGoldenScore,
  onEndMatch,
  onReset,
  onShowKeys,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ControlBtn label="Undo" onClick={onUndo} disabled={!canUndo} icon={<Undo2 className="w-4 h-4" />} />
      <ControlBtn
        label="Golden Score"
        onClick={onGoldenScore}
        disabled={phase !== 'regulation'}
        icon={<Trophy className="w-4 h-4" />}
      />
      <ControlBtn
        label="Switch Sides"
        onClick={onSwitchSides}
        disabled={phase === 'ended'}
        icon={<ArrowLeftRight className="w-4 h-4" />}
      />
      <ControlBtn
        label="End Match"
        onClick={onEndMatch}
        disabled={phase === 'ended'}
        icon={<Square className="w-4 h-4" />}
        variant="destructive"
      />
      <ControlBtn label="New Match" onClick={onReset} icon={<RotateCcw className="w-4 h-4" />} />
      <ControlBtn label="Keys" onClick={onShowKeys} icon={<Keyboard className="w-4 h-4" />} />
    </div>
  );
}

function ControlBtn({
  label,
  onClick,
  disabled,
  icon,
  variant,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  variant?: 'destructive';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs md:text-sm font-semibold uppercase tracking-wider transition-colors',
        variant === 'destructive'
          ? 'bg-destructive/20 hover:bg-destructive/30 text-destructive'
          : 'bg-secondary hover:bg-secondary/80 text-foreground',
        'disabled:opacity-30 disabled:cursor-not-allowed',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
