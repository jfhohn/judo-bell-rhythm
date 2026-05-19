import { useEffect, useState } from 'react';
import { MatchState } from '@/lib/matchTypes';
import { liveClockSec, liveOsaekomiSec } from '@/lib/matchReducer';
import { useSubscribeMatch } from '@/hooks/useMatchSync';
import { ShidoCards } from '@/components/tournament/ShidoCards';
import { cn } from '@/lib/utils';

function fmt(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function TournamentDisplay() {
  const [state, setState] = useState<MatchState | null>(null);
  const [now, setNow] = useState(() => performance.now());
  useSubscribeMatch(setState);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setNow(performance.now());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!state) {
    return (
      <div className="min-h-screen bg-scoreboard flex items-center justify-center text-foreground">
        Waiting for match…
      </div>
    );
  }

  const clock = liveClockSec(state, now);
  const ose = liveOsaekomiSec(state, now);

  return (
    <div className="min-h-screen bg-scoreboard text-foreground p-4 md:p-8 flex flex-col gap-4">
      <Row
        side="white"
        athlete={state.white}
        score={state.scores.white}
        osaekomi={state.osaekomi.side === 'white' ? ose : 0}
      />
      <Row
        side="blue"
        athlete={state.blue}
        score={state.scores.blue}
        osaekomi={state.osaekomi.side === 'blue' ? ose : 0}
      />

      <div className="rounded-2xl bg-card p-6 flex items-center justify-between gap-6 flex-1">
        <div>
          <div
            className={cn(
              'text-sm md:text-base uppercase tracking-[0.3em] font-semibold',
              state.phase === 'ended' ? 'text-success' : state.phase === 'golden-score' ? 'text-warning' : 'text-warning',
            )}
          >
            {state.phase === 'ended'
              ? 'Final'
              : state.phase === 'golden-score'
                ? 'Golden Score'
                : 'In Match'}
          </div>
          <div className="text-2xl md:text-4xl font-bold mt-2">{state.divisionLabel || 'Mock match'}</div>
        </div>
        <div
          className={cn(
            'font-mono font-bold tabular-nums text-8xl md:text-[10rem] leading-none',
            state.phase === 'ended' ? 'text-muted-foreground' : 'text-warning',
          )}
        >
          {fmt(clock)}
        </div>
      </div>
    </div>
  );
}

function Row({
  side,
  athlete,
  score,
  osaekomi,
}: {
  side: 'white' | 'blue';
  athlete: MatchState['white'];
  score: MatchState['scores']['white'];
  osaekomi: number;
}) {
  const isWhite = side === 'white';
  return (
    <div
      className={cn(
        'rounded-2xl p-6 md:p-8 flex items-center justify-between gap-6 flex-1',
        isWhite ? 'bg-athlete-white text-athlete-white-foreground' : 'bg-athlete-blue text-athlete-blue-foreground',
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <span className={cn('w-4 h-4 rounded-full', isWhite ? 'bg-red-500' : 'bg-white')} />
          <h2 className="font-bold uppercase text-3xl md:text-5xl truncate">
            {athlete.name || (isWhite ? 'White' : 'Blue')}
          </h2>
        </div>
        <div
          className={cn(
            'mt-1 uppercase tracking-widest text-sm md:text-base',
            isWhite ? 'text-athlete-white-muted' : 'text-athlete-blue-muted',
          )}
        >
          {athlete.country} {athlete.club && `· ${athlete.club}`}
        </div>
      </div>
      <div className="flex items-center gap-4 md:gap-6">
        {osaekomi > 0 && (
          <div className="rounded-md bg-osaekomi text-white px-3 py-2 text-center animate-pulse">
            <div className="font-mono font-bold text-xl tabular-nums">{fmt(osaekomi)}</div>
            <div className="text-[10px] uppercase tracking-widest">Osae komi</div>
          </div>
        )}
        <ShidoCards count={score.shido} />
        <div className="font-mono font-bold text-7xl md:text-9xl tabular-nums leading-none min-w-[2ch] text-right">
          {score.ippon > 0 ? 'I' : score.wazari}
        </div>
      </div>
    </div>
  );
}
