import { WinReason, Side } from '@/lib/matchTypes';
import { cn } from '@/lib/utils';

interface Option {
  reason: WinReason;
  label: string;
  needsSide: boolean; // true = pick winner first
  winner?: Side | 'draw' | 'double';
}

const OPTIONS: Option[] = [
  { reason: 'ippon',           label: 'Ippon',         needsSide: true },
  { reason: 'wazari',          label: 'Wazari',        needsSide: true },
  { reason: 'walkover',        label: 'Walkover',      needsSide: true },
  { reason: 'hansokumake',     label: 'Hansokumake',   needsSide: true },
  { reason: 'no-show',         label: 'No Show',       needsSide: true },
  { reason: 'decision',        label: 'Decision',      needsSide: true },
  { reason: 'draw',            label: 'Draw',          needsSide: false, winner: 'draw' },
  { reason: 'double-wo-dq',    label: 'Double WO/DQ',  needsSide: false, winner: 'double' },
  { reason: 'double-no-show',  label: 'Double No Show',needsSide: false, winner: 'double' },
];

interface Props {
  pickingSide: Side | null;
  onSelect: (winner: Side | 'draw' | 'double', reason: WinReason) => void;
  onCancel: () => void;
}

export function EndGamePanel({ pickingSide, onSelect, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel max-w-2xl w-full p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold">
            {pickingSide ? `${pickingSide === 'white' ? 'White' : 'Blue'} wins by…` : 'End match — select reason'}
          </h2>
          <button onClick={onCancel} className="btn-icon" aria-label="Cancel">✕</button>
        </div>

        {!pickingSide && (
          <p className="text-sm text-muted-foreground mb-4">
            Choose the winning side from the scoreboard first, or pick a non-sided result below.
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {OPTIONS.map((o) => {
            const disabled = o.needsSide && !pickingSide;
            return (
              <button
                key={o.reason}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onSelect(
                    o.needsSide ? (pickingSide as Side) : (o.winner as Side | 'draw' | 'double'),
                    o.reason,
                  )
                }
                className={cn(
                  'rounded-lg px-4 py-4 font-semibold uppercase tracking-wider',
                  'bg-secondary hover:bg-secondary/80 transition-all',
                  'disabled:opacity-30 disabled:cursor-not-allowed',
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
