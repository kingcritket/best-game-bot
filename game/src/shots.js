// Mothlight — staged states for the entry's screenshots.
// ?shot=start|play|win|end&seed=N freezes the game in a composed state so a
// screenshot shows the title, a busy mid-game HUD, the victory screen or the
// game-over screen. Nothing here ships fake art: every pixel is the game's
// own renderer drawing its own live state, only posed.

import { VIEW } from './config.js';
import { createWorld, startGame } from './world.js';
import { createBoss } from './boss.js';
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
    // The climax: wave 8, quota banked, the Sovereign half-broken — with
    // the new threats in frame: an orbiter guarding the bloom, a fading
    // stalker, a lunger, and a Lantern Nova waiting to be grabbed.
    world.state = 'playing';
    world.wave = 8;
    world.quota = 40;
    world.bankedWave = 40;
    world.bankedTotal = 148;
    world.bossPhase = true;
    world.boss = createBoss(world);
    world.boss.hp = 3;
    world.boss.x = 640;
    world.boss.y = 210;
    world.boss.telegraph = 0.4;
    world.score = 4150;
    world.carried = 9;
    world.combo = 11;
    world.comboTimer = 2.0;
    world.maxCombo = 14;
    world.lives = 2;
    world.charge = 55;
    world.waveTimeLeft = 47;
    world.banner = { text: 'Break the Night Sovereign!', sub: 'The quota is banked — scatter the boss to win' };
    world.bannerT = 0; // HUD already says BREAK THE SOVEREIGN; a banner here would cover the boss HP bar.
    placeWisps(world, 3, ['orbiter', 'stalker', 'lunger']);
    world.wisps[0].orbitAngle = 0.6;
    world.wisps[0].orbitR = 115;
    world.wisps[0].x = 480 + Math.cos(0.6) * 115;
    world.wisps[0].y = 300 + Math.sin(0.6) * 115;
    world.wisps[1].alpha = 0.45;
    world.powerups.push({ x: 150, y: 150, kind: 'nova', phase: 1, life: 10 });
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
    world.score = 5420;
    world.bankedTotal = 188;
    world.bankedWave = 40;
    world.stats = { collected: 214, wispsScattered: 31, dashes: 38, powerups: 6 };
    world.maxCombo = 21;
    world.endedAt = 540;
    world.best = 5420;
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
