// Mothlight — staged states for the entry's screenshots.
// ?shot=start|play|win|end&seed=N freezes the game in a composed state so a
// screenshot shows the title, a busy mid-game HUD, the victory screen or the
// game-over screen. Nothing here ships fake art: every pixel is the game's
// own renderer drawing its own live state, only posed.

import { VIEW } from './config.js';
import { createWorld, startGame } from './world.js';
import { range } from './random.js';

function placeWisps(world, n, kinds) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.5;
    const r = 150 + (i % 3) * 55;
    world.wisps.push({
      x: VIEW.w / 2 + Math.cos(a) * r,
      y: VIEW.h / 2 + Math.sin(a) * r * 0.7,
      vx: 0, vy: 0,
      kind: kinds[i % kinds.length],
      radius: kinds[i % kinds.length] === 'splitter' ? 20 : 16,
      speed: 90,
      phase: i * 1.3,
      lungeT: 1.5,
      lunging: 0,
      telegraph: 0,
      wobble: 1,
    });
  }
}

function scatterPollen(world, n) {
  for (let i = 0; i < n; i++) {
    const a = world.rng() * Math.PI * 2;
    const r = range(world.rng, 70, 280);
    world.pollen.push({
      x: Math.min(Math.max(VIEW.w / 2 + Math.cos(a) * r, 30), VIEW.w - 30),
      y: Math.min(Math.max(VIEW.h / 2 + Math.sin(a) * r, 40), VIEW.h - 30),
      vx: 0, vy: 0,
      phase: i * 0.9,
      size: 5,
    });
  }
}

// Returns a world posed for the requested shot, frozen at a fixed time so
// the render is identical on every run with the same seed.
export function stageShot(name, seed) {
  const world = createWorld(seed);
  world.time = 6.5;
  if (name === 'start') {
    world.state = 'title';
    scatterPollen(world, 10);
    placeWisps(world, 2, ['chaser']);
    world.player.x = VIEW.w / 2;
    world.player.y = VIEW.h / 2 + 130;
    return world;
  }
  startGame(world);
  world.time = 6.5;
  world.player.x = VIEW.w / 2 + 120;
  world.player.y = VIEW.h / 2 + 90;
  world.player.vx = 120;
  world.player.vy = -40;
  world.player.angle = -0.4;
  world.player.flap = 2.2;
  world.player.trail = [
    { x: world.player.x - 40, y: world.player.y + 16, life: 0.2 },
    { x: world.player.x - 70, y: world.player.y + 28, life: 0.14 },
  ];
  scatterPollen(world, 14);
  if (name === 'play') {
    world.state = 'playing';
    world.wave = 3;
    world.quota = 20;
    world.bankedWave = 11;
    world.bankedTotal = 41;
    world.score = 1240;
    world.carried = 6;
    world.combo = 12;
    world.comboTimer = 2.0;
    world.maxCombo = 12;
    world.lives = 3;
    world.charge = 68;
    world.waveTimeLeft = 47;
    world.banner = { text: 'Wave 3 — the dark deepens', sub: 'Bank 20 pollen before the night ends' };
    world.bannerT = 2.0;
    placeWisps(world, 4, ['chaser', 'splitter', 'lunger', 'chaser']);
    world.powerups.push({ x: 150, y: 150, kind: 'magnet', phase: 1, life: 10 });
    world.particles.push(
      { x: 620, y: 330, vx: 30, vy: -40, life: 0.6, maxLife: 0.9, size: 3, color: '#ffe66d' },
      { x: 640, y: 350, vx: -20, vy: -60, life: 0.7, maxLife: 0.9, size: 2.5, color: '#ffe66d' },
    );
    world.texts.push({ x: 620, y: 300, text: '+25', color: '#cfc6ff', life: 0.9, maxLife: 1.1 });
    return world;
  }
  if (name === 'win') {
    world.state = 'win';
    world.wave = 8;
    world.score = 4860;
    world.bankedTotal = 148;
    world.bankedWave = 40;
    world.stats = { collected: 172, wispsScattered: 23, dashes: 31, powerups: 5 };
    world.maxCombo = 21;
    world.endedAt = 512;
    world.best = 4860;
    world.lives = 2;
    world.particles.push(
      { x: 480, y: 300, vx: 40, vy: -80, life: 0.7, maxLife: 0.9, size: 4, color: '#ffd166' },
      { x: 430, y: 320, vx: -50, vy: -60, life: 0.6, maxLife: 0.9, size: 3, color: '#ffd166' },
      { x: 530, y: 320, vx: 60, vy: -50, life: 0.8, maxLife: 0.9, size: 3, color: '#ff9f5a' },
    );
    return world;
  }
  // 'end'
  world.state = 'over';
  world.wave = 5;
  world.score = 2310;
  world.bankedTotal = 86;
  world.bankedWave = 9;
  world.stats = { collected: 104, wispsScattered: 14, dashes: 19, powerups: 3 };
  world.maxCombo = 15;
  world.lives = 0;
  world.best = 4860;
  world.player.x = VIEW.w / 2 - 60;
  world.player.y = VIEW.h / 2 + 60;
  world.particles.push(
    { x: world.player.x, y: world.player.y, vx: 30, vy: -40, life: 0.6, maxLife: 0.9, size: 3, color: '#ff5d73' },
    { x: world.player.x, y: world.player.y, vx: -35, vy: -20, life: 0.7, maxLife: 0.9, size: 2.5, color: '#8b7ff0' },
  );
  placeWisps(world, 3, ['chaser', 'lunger', 'chaser']);
  return world;
}

export function readShotQuery() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return null;
  const seed = Number(params.get('seed') || 1) || 1;
  return { shot, seed };
}
