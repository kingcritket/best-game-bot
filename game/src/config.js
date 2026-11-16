// Mothlight — tuning constants and palette.
// One place for every number the game balances on: speeds, spawn rates,
// wave quotas, scores and colours. Nothing here is read from the network;
// the whole game is static files under game/.

export const VIEW = { w: 960, h: 600 };

export const PALETTE = {
  skyTop: '#0a0f2e',
  skyMid: '#181c48',
  skyBot: '#2a1c52',
  ground: '#141a38',
  bloom: '#ffd166',
  bloomCore: '#fff3c4',
  bloomPetal: '#ff9f5a',
  pollen: '#ffe66d',
  pollenHalo: 'rgba(255, 230, 109, 0.35)',
  moth: '#fff7d6',
  mothWing: '#ffd166',
  mothWingDeep: '#ff9f5a',
  wisp: '#8b7ff0',
  wispCore: '#cfc6ff',
  wispEye: '#ff5d73',
  heart: '#ff6b81',
  heartEmpty: '#3a3f6b',
  text: '#f4f1ff',
  dim: '#a9a3d6',
  gold: '#ffd166',
  hudBg: 'rgba(9, 11, 32, 0.55)',
  hudLine: 'rgba(180, 175, 230, 0.25)',
};

export const PLAYER = {
  radius: 14,
  accel: 2600,
  maxSpeed: 330,
  friction: 0.86,
  dashSpeed: 760,
  dashTime: 0.16,
  dashCooldown: 0.9,
  dashCost: 12,
  invulnTime: 2.0,
  lives: 3,
  startCharge: 55,
};

export const POLLEN = {
  maxField: 26,
  spawnInterval: 0.85,
  collectRadius: 30,
  chargeGain: 6,
};

export const WISP = {
  baseSpeed: 78,
  speedPerWave: 9,
  spawnInterval: 2.6,
  spawnStepPerWave: 0.22,
  maxExtra: 3,
};

export const WAVES = {
  total: 8,
  timePerWave: 75,
  quotaBase: 12,
  quotaPerWave: 4,
};

export const COMBO = { window: 2.5, step: 5, maxMult: 5 };

export const SCORE = {
  collect: 5,
  bank: 20,
  wisp: 25,
  waveBonus: 100,
  timeBonus: 5,
};

export const POWERUP = {
  spawnInterval: 17,
  magnetTime: 8,
  slowTime: 5,
};

// The Night Sovereign, boss of wave 8: six dash-hits to break.
export const BOSS = {
  radius: 34,
  hp: 6,
  speed: 56,
  summonInterval: 5,
  lungeRange: 300,
  lungeWindup: 0.7,
  lungeTime: 0.5,
  lungeMult: 3.0,
  score: 250,
};

// Golden moon-pollen: rare, bright, worth three carried.
export const GOLDEN = { chance: 0.06, carry: 3, score: 15, charge: 12 };
