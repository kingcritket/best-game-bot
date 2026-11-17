// Mothlight — wave threats: what each wave adds and what the player is told.
// One wave, one new danger, so the challenge visibly grows as the player
// gets better: splitters, then bloom-guarding orbiters, lungers, fading
// stalkers, a thickening dark, and finally the Night Sovereign.

import { WAVES, WISP } from './config.js';

// The new threat a wave introduces, named for the banner that announces it.
export function waveThreat(wave) {
  if (wave >= WAVES.total) return { name: 'Night Sovereign', line: 'Only a dash can crack the Sovereign — break it to win' };
  if (wave >= 7) return { name: 'Thick dark', line: 'The dark thickens — every wisp moves faster now' };
  if (wave >= 6) return { name: 'Stalkers', line: 'Stalkers fade in and out of sight — watch the shimmer' };
  if (wave >= 5) return { name: 'Lungers', line: 'Lungers telegraph, then strike — dash away as they flash' };
  if (wave >= 4) return { name: 'Orbiters', line: 'Orbiters guard the Heart Bloom — time your banking run' };
  if (wave >= 3) return { name: 'Splitters', line: 'Splitters break in two when dashed — scatter both halves' };
  if (wave >= 2) return { name: 'More wisps', line: 'More wisps hunt the garden now' };
  return { name: 'Night falls', line: 'Bank the quota at the Heart Bloom' };
}

// Wisp speed multiplier for a wave: the dark thickens late on.
export function waveSpeedMult(wave) {
  return wave >= WISP.lateWave ? WISP.lateSpeedMult : 1;
}
