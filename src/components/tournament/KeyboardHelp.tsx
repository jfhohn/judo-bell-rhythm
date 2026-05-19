interface Props {
  onClose: () => void;
}

const ROWS: [string, string][] = [
  ['Space',           'Start / Pause main clock'],
  ['Q  /  W  /  E',   'White: +Ippon / +Wazari / +Shido (Shift = remove)'],
  ['A  /  S  /  D',   'Blue: +Ippon / +Wazari / +Shido (Shift = remove)'],
  ['O',               'Start / stop osaekomi on White'],
  ['K',               'Start / stop osaekomi on Blue'],
  ['←  /  →',         'Nudge clock −1s / +1s'],
  ['Shift + ← / →',   'Nudge clock −30s / +30s'],
  ['U',               'Undo last action'],
  ['X',               'Switch sides'],
  ['G',               'Enter Golden Score'],
  ['Enter',           'End match (open reason panel)'],
  ['?',               'Show this help'],
];

export function KeyboardHelp({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Keyboard shortcuts</h2>
          <button onClick={onClose} className="btn-icon" aria-label="Close">✕</button>
        </div>
        <div className="space-y-1.5 text-sm">
          {ROWS.map(([k, desc]) => (
            <div key={k} className="flex items-center justify-between gap-4 py-1.5 border-b border-border/40 last:border-0">
              <kbd className="font-mono text-xs bg-secondary px-2 py-1 rounded">{k}</kbd>
              <span className="text-muted-foreground text-right">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
