import { Athlete, AthleteScore, ScoreKind, Side } from '@/lib/matchTypes';
import { cn } from '@/lib/utils';
import { ShidoCards } from './ShidoCards';
import { OsaekomiChip } from './OsaekomiChip';

interface Props {
  side: Side;
  athlete: Athlete;
  score: AthleteScore;
  osaekomiActive: boolean;
  osaekomiSec: number;
  onAthleteChange: (a: Athlete) => void;
  onScore: (kind: ScoreKind, delta: 1 | -1) => void;
  onOsaekomiToggle: () => void;
  disabled?: boolean;
}

export function AthleteRow({
  side,
  athlete,
  score,
  osaekomiActive,
  osaekomiSec,
  onAthleteChange,
  onScore,
  onOsaekomiToggle,
  disabled,
}: Props) {
  const isWhite = side === 'white';
  const bg = isWhite ? 'bg-athlete-white' : 'bg-athlete-blue';
  const fg = isWhite ? 'text-athlete-white-foreground' : 'text-athlete-blue-foreground';
  const muted = isWhite ? 'text-athlete-white-muted' : 'text-athlete-blue-muted';
  const inputBg = isWhite ? 'bg-black/5' : 'bg-white/10';
  const btnBg = isWhite ? 'bg-black/5 hover:bg-black/10' : 'bg-white/10 hover:bg-white/20';

  return (
    <div className={cn('rounded-2xl p-4 md:p-5 flex flex-col gap-3', bg, fg)}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <span
            className={cn(
              'w-3 h-3 rounded-full shrink-0',
              isWhite ? 'bg-red-500' : 'bg-white',
            )}
            aria-hidden
          />
          <div className="flex-1 min-w-0">
            <input
              value={athlete.name}
              onChange={(e) => onAthleteChange({ ...athlete, name: e.target.value })}
              placeholder="ATHLETE NAME"
              className={cn(
                'w-full bg-transparent border-0 outline-none font-bold uppercase tracking-wide text-xl md:text-3xl',
                'placeholder:opacity-40',
              )}
            />
            <div className={cn('flex items-center gap-2 text-xs md:text-sm uppercase tracking-widest', muted)}>
              <input
                value={athlete.country}
                onChange={(e) =>
                  onAthleteChange({ ...athlete, country: e.target.value.toUpperCase().slice(0, 3) })
                }
                placeholder="—"
                className={cn('bg-transparent border-0 outline-none w-10 font-bold')}
              />
              <input
                value={athlete.club}
                onChange={(e) => onAthleteChange({ ...athlete, club: e.target.value })}
                placeholder="CLUB"
                className="bg-transparent border-0 outline-none flex-1 min-w-0"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <OsaekomiChip active={osaekomiActive} seconds={osaekomiSec} onToggle={onOsaekomiToggle} />
          <ShidoCards count={score.shido} />
          <div className="font-mono font-bold text-5xl md:text-7xl tabular-nums min-w-[3ch] text-right leading-none">
            {score.ippon > 0 ? 'I' : score.wazari}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(['ippon', 'wazari', 'shido'] as ScoreKind[]).map((kind) => (
          <button
            key={`add-${kind}`}
            type="button"
            disabled={disabled}
            onClick={() => onScore(kind, 1)}
            className={cn(
              'rounded-lg px-3 py-2 text-sm md:text-base font-semibold uppercase tracking-wider transition-colors',
              btnBg,
              'text-emerald-500 disabled:opacity-40',
            )}
          >
            + {kind}
          </button>
        ))}
        {(['ippon', 'wazari', 'shido'] as ScoreKind[]).map((kind) => (
          <button
            key={`sub-${kind}`}
            type="button"
            disabled={disabled}
            onClick={() => onScore(kind, -1)}
            className={cn(
              'rounded-lg px-3 py-2 text-sm md:text-base font-semibold uppercase tracking-wider transition-colors',
              inputBg,
              'text-rose-500 disabled:opacity-40',
            )}
          >
            − {kind}
          </button>
        ))}
      </div>
    </div>
  );
}
