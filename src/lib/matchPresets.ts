import { RuleConfig } from './matchTypes';

export interface MatchPreset {
  id: string;
  label: string;
  org: 'IJF' | 'USA Judo' | 'Custom';
  rule: RuleConfig;
}

const ijfBase: Omit<RuleConfig, 'durationSec'> = {
  goldenScoreCapSec: 0, // unlimited
  shidoToDq: 3,
  osaekomiWazariSec: 10,
  osaekomiIpponSec: 20,
};

export const MATCH_PRESETS: MatchPreset[] = [
  // IJF
  { id: 'ijf-senior',  label: 'IJF Senior (4:00)',  org: 'IJF', rule: { ...ijfBase, durationSec: 240 } },
  { id: 'ijf-junior',  label: 'IJF Junior (4:00)',  org: 'IJF', rule: { ...ijfBase, durationSec: 240 } },
  { id: 'ijf-cadet',   label: 'IJF Cadet (4:00)',   org: 'IJF', rule: { ...ijfBase, durationSec: 240 } },
  { id: 'ijf-veteran', label: 'IJF Veteran (3:00)', org: 'IJF', rule: { ...ijfBase, durationSec: 180 } },

  // USA Judo youth
  { id: 'usa-bantam',       label: 'USA Judo Bantam (2:00)',       org: 'USA Judo', rule: { ...ijfBase, durationSec: 120 } },
  { id: 'usa-intermediate', label: 'USA Judo Intermediate (3:00)', org: 'USA Judo', rule: { ...ijfBase, durationSec: 180 } },
  { id: 'usa-juvenile',     label: 'USA Judo Juvenile (3:00)',     org: 'USA Judo', rule: { ...ijfBase, durationSec: 180 } },

  // Custom default
  { id: 'custom', label: 'Custom', org: 'Custom', rule: { ...ijfBase, durationSec: 240 } },
];

export const DEFAULT_PRESET_ID = 'ijf-senior';

export function getPreset(id: string): MatchPreset {
  return MATCH_PRESETS.find((p) => p.id === id) ?? MATCH_PRESETS[0];
}
