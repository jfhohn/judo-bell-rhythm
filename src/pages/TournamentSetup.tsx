import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Athlete, RuleConfig } from '@/lib/matchTypes';
import { MATCH_PRESETS, DEFAULT_PRESET_ID, getPreset } from '@/lib/matchPresets';
import { createMatchState } from '@/lib/matchReducer';
import { saveMatch } from '@/lib/matchStore';

const EMPTY_ATHLETE: Athlete = { name: '', country: '', club: '' };

function secToMMSS(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
function mmssToSec(v: string) {
  const [m, s] = v.split(':').map((x) => parseInt(x, 10) || 0);
  return Math.max(0, m * 60 + (s || 0));
}

export default function TournamentSetup() {
  const navigate = useNavigate();
  const [presetId, setPresetId] = useState(DEFAULT_PRESET_ID);
  const preset = getPreset(presetId);
  const [rule, setRule] = useState<RuleConfig>(preset.rule);
  const [white, setWhite] = useState<Athlete>(EMPTY_ATHLETE);
  const [blue, setBlue] = useState<Athlete>(EMPTY_ATHLETE);
  const [division, setDivision] = useState('Showing / Judo / -73 KG');

  function onPresetChange(id: string) {
    setPresetId(id);
    setRule(getPreset(id).rule);
  }

  async function startMatch() {
    const state = createMatchState({
      presetId,
      rule,
      white,
      blue,
      divisionLabel: division,
    });
    await saveMatch(state);
    navigate('/tournament');
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            ← Back to Class Bell
          </button>
          <h1 className="text-3xl md:text-4xl font-bold">New Match</h1>
          <p className="text-muted-foreground mt-1">
            Configure a match. Times are seconds; durations support custom values.
          </p>
        </div>

        <section className="glass-panel p-5 space-y-4">
          <h2 className="font-semibold uppercase tracking-widest text-sm text-muted-foreground">
            Rule preset
          </h2>
          <select
            value={presetId}
            onChange={(e) => onPresetChange(e.target.value)}
            className="w-full bg-secondary rounded-md px-3 py-2"
          >
            {(['IJF', 'USA Judo', 'Custom'] as const).map((org) => (
              <optgroup key={org} label={org}>
                {MATCH_PRESETS.filter((p) => p.org === org).map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </optgroup>
            ))}
          </select>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Match (mm:ss)">
              <input
                value={secToMMSS(rule.durationSec)}
                onChange={(e) => setRule({ ...rule, durationSec: mmssToSec(e.target.value) })}
                className="w-full bg-secondary rounded-md px-3 py-2 font-mono"
              />
            </Field>
            <Field label="Golden cap (mm:ss, 0=∞)">
              <input
                value={secToMMSS(rule.goldenScoreCapSec)}
                onChange={(e) => setRule({ ...rule, goldenScoreCapSec: mmssToSec(e.target.value) })}
                className="w-full bg-secondary rounded-md px-3 py-2 font-mono"
              />
            </Field>
            <Field label="Shido → DQ">
              <input
                type="number" min={1} max={5}
                value={rule.shidoToDq}
                onChange={(e) => setRule({ ...rule, shidoToDq: parseInt(e.target.value) || 3 })}
                className="w-full bg-secondary rounded-md px-3 py-2 font-mono"
              />
            </Field>
            <Field label="Osaekomi W / I (s)">
              <div className="flex gap-2">
                <input
                  type="number" min={1}
                  value={rule.osaekomiWazariSec}
                  onChange={(e) => setRule({ ...rule, osaekomiWazariSec: parseInt(e.target.value) || 10 })}
                  className="w-full bg-secondary rounded-md px-3 py-2 font-mono"
                />
                <input
                  type="number" min={1}
                  value={rule.osaekomiIpponSec}
                  onChange={(e) => setRule({ ...rule, osaekomiIpponSec: parseInt(e.target.value) || 20 })}
                  className="w-full bg-secondary rounded-md px-3 py-2 font-mono"
                />
              </div>
            </Field>
          </div>
        </section>

        <section className="glass-panel p-5 space-y-4">
          <h2 className="font-semibold uppercase tracking-widest text-sm text-muted-foreground">
            Athletes (optional)
          </h2>
          <Field label="Division label">
            <input
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className="w-full bg-secondary rounded-md px-3 py-2"
            />
          </Field>
          <AthleteFields label="White" value={white} onChange={setWhite} />
          <AthleteFields label="Blue" value={blue} onChange={setBlue} />
        </section>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => navigate('/tournament')}
            className="px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80"
          >
            Cancel
          </button>
          <button
            onClick={startMatch}
            className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            Start match
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}

function AthleteFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Athlete;
  onChange: (a: Athlete) => void;
}) {
  return (
    <div>
      <div className="text-sm font-semibold mb-2">{label}</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input
          placeholder="Name"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          className="bg-secondary rounded-md px-3 py-2"
        />
        <input
          placeholder="Country (3 letters)"
          value={value.country}
          onChange={(e) => onChange({ ...value, country: e.target.value.toUpperCase().slice(0, 3) })}
          className="bg-secondary rounded-md px-3 py-2"
        />
        <input
          placeholder="Club"
          value={value.club}
          onChange={(e) => onChange({ ...value, club: e.target.value })}
          className="bg-secondary rounded-md px-3 py-2"
        />
      </div>
    </div>
  );
}
