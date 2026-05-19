import { cn } from '@/lib/utils';

interface Props {
  active: boolean;
  seconds: number;
  onToggle: () => void;
}

function fmt(sec: number) {
  const s = Math.floor(sec);
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export function OsaekomiChip({ active, seconds, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'rounded-md px-3 py-2 text-center transition-all border-2',
        active
          ? 'bg-osaekomi border-osaekomi text-white animate-pulse'
          : 'bg-osaekomi/90 border-transparent text-white hover:brightness-110',
      )}
      aria-label="Toggle osaekomi"
    >
      <div className="font-mono font-bold text-lg md:text-xl leading-none tabular-nums">
        {fmt(seconds)}
      </div>
      <div className="text-[10px] md:text-xs uppercase tracking-widest mt-0.5">
        Osae komi
      </div>
    </button>
  );
}
