// Mothlight — the world: entities, rules and the update step.
// Luma the lantern-moth gathers glowpollen drifting through a dark garden
// and banks it at the Heart Bloom. Shadow wisps hunt her: a dash scatters
// them, a touch costs a life and spills her carried pollen. Each wave asks
// for a bigger banked quota before the night timer runs out; clear all eight
// waves and the garden blooms — that is the win. Lose all three lives and
// the light goes out.

import { VIEW, PALETTE, PLAYER, POLLEN, WISP, WAVES, COMBO, SCORE, POWERUP } from './config.js';
import { makeRng, range, pick, chance, clamp, dist2 } from './random.js';

const BLOOM = { x: VIEW.w / 2, y: VIEW.h / 2, baseRadius: 46 };
const MARGIN = 26;

export function comboMult(combo) {
  return Math.min(COMBO.maxMult, 1 + Math.floor(combo / COMBO.step));
}

export function waveQuota(wave) {
  return WAVES.quotaBase + (wave - 1) * WAVES.quotaPerWave;
}

export function createWorld(seed = 20261116) {
  const rng = makeRng(seed);
  const world = {
    seed,
    rng,
    time: 0,
    state: 'title',
    wave: 1,
    waveTimeLeft: WAVES.timePerWave,
    quota: waveQuota(1),
    bankedWave: 0,
    bankedTotal: 0,
    score: 0,
    carried: 0,
    combo: 0,
    comboTimer: 0,
    maxCombo: 0,
    lives: PLAYER.lives,
    charge: PLAYER.startCharge,
    dashCooldown: 0,
    invuln: 0,
    shield: false,
    magnetTimer: 0,
    slowTimer: 0,
    pollenTimer: 0,
    wispTimer: 1.6,
    powerupTimer: POWERUP.spawnInterval,
    player: {
      x: VIEW.w / 2,
      y: VIEW.h / 2 + 130,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      flap: 0,
      dashing: 0,
      dashX: 0,
      dashY: 0,
      trail: [],
    },
    pollen: [],
    wisps: [],
    powerups: [],
    particles: [],
    texts: [],
    flowers: [],
    fireflies: [],
    petals: [],
    shake: 0,
    flash: 0,
    banner: null,
    bannerT: 0,
    intermission: 0,
    stats: { collected: 0, wispsScattered: 0, dashes: 0, powerups: 0 },
    best: 0,
    endedAt: 0,
  };
  try {
    world.best = Number(window.localStorage.getItem('mothlight-best') || 0) || 0;
  } catch {
    world.best = 0;
  }
  // The garden itself: glowing flowers, drifting fireflies and petals,
  // placed once from the seeded stream so a seed always draws one garden.
  const flowerCols = ['#ff9f5a', '#ffd166', '#c9b8ff', '#7fe3c3', '#ff8fb0'];
  for (let i = 0; i < 26; i++) {
    world.flowers.push({
      x: range(rng, 30, VIEW.w - 30),
      y: range(rng, 40, VIEW.h - 30),
      r: range(rng, 4, 11),
      color: pick(rng, flowerCols),
      phase: range(rng, 0, Math.PI * 2),
      petals: 5 + Math.floor(rng() * 3),
    });
  }
  for (let i = 0; i < 24; i++) {
    world.fireflies.push({
      x: range(rng, 0, VIEW.w),
      y: range(rng, 0, VIEW.h),
      phase: range(rng, 0, Math.PI * 2),
      speed: range(rng, 0.2, 0.7),
      size: range(rng, 1, 2.4),
    });
  }
  for (let i = 0; i < 18; i++) {
    world.petals.push({
      x: range(rng, 0, VIEW.w),
      y: range(rng, 0, VIEW.h),
      vy: range(rng, 6, 18),
      sway: range(rng, 0.4, 1.4),
      phase: range(rng, 0, Math.PI * 2),
      size: range(rng, 2.5, 5),
      color: pick(rng, flowerCols),
    });
  }
  return world;
}

export function startGame(world) {
  const fresh = createWorld(world.seed);
  fresh.state = 'playing';
  fresh.best = world.best;
  Object.keys(fresh).forEach((key) => {
    world[key] = fresh[key];
  });
  world.player.x = VIEW.w / 2;
  world.player.y = VIEW.h / 2 + 130;
  showBanner(world, 'Wave 1 — Night falls', 'Bank ' + world.quota + ' pollen at the Heart Bloom');
  spawnPollen(world, 8);
}

function showBanner(world, text, sub = '') {
  world.banner = { text, sub };
  world.bannerT = 2.6;
}

function spawnPollen(world, n = 1) {
  for (let i = 0; i < n && world.pollen.length < POLLEN.maxField; i++) {
    const angle = world.rng() * Math.PI * 2;
    const radius = range(world.rng, 90, 300);
    world.pollen.push({
      x: clamp(BLOOM.x + Math.cos(angle) * radius, 30, VIEW.w - 30),
      y: clamp(BLOOM.y + Math.sin(angle) * radius, 40, VIEW.h - 30),
      vx: range(world.rng, -12, 12),
      vy: range(world.rng, -12, 12),
      phase: range(world.rng, 0, Math.PI * 2),
      size: range(world.rng, 4, 6.5),
    });
  }
}

function spawnWisp(world) {
  const edge = Math.floor(world.rng() * 4);
  let x;
  let y;
  if (edge === 0) { x = range(world.rng, 0, VIEW.w); y = -20; }
  else if (edge === 1) { x = VIEW.w + 20; y = range(world.rng, 0, VIEW.h); }
  else if (edge === 2) { x = range(world.rng, 0, VIEW.w); y = VIEW.h + 20; }
  else { x = -20; y = range(world.rng, 0, VIEW.h); }
  let kind = 'chaser';
  if (world.wave >= 5 && chance(world.rng, 0.3)) kind = 'lunger';
  else if (world.wave >= 3 && chance(world.rng, 0.3)) kind = 'splitter';
  const speed = (WISP.baseSpeed + (world.wave - 1) * WISP.speedPerWave) * range(world.rng, 0.9, 1.15);
  world.wisps.push({
    x, y, vx: 0, vy: 0, kind,
    radius: kind === 'splitter' ? 20 : 16,
    speed,
    phase: range(world.rng, 0, Math.PI * 2),
    lungeT: range(world.rng, 1.2, 2.4),
    lunging: 0,
    telegraph: 0,
    wobble: range(world.rng, 0.6, 1.4),
  });
}

function spawnPowerup(world) {
  const kinds = ['magnet', 'shield', 'slow'];
  world.powerups.push({
    x: range(world.rng, 60, VIEW.w - 60),
    y: range(world.rng, 70, VIEW.h - 60),
    kind: pick(world.rng, kinds),
    phase: range(world.rng, 0, Math.PI * 2),
    life: 12,
  });
}

function burst(world, x, y, color, n, speed = 120, size = 3) {
  for (let i = 0; i < n; i++) {
    const a = world.rng() * Math.PI * 2;
    const s = range(world.rng, speed * 0.3, speed);
    world.particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: range(world.rng, 0.4, 0.9),
      maxLife: 0.9,
      size: range(world.rng, size * 0.5, size * 1.4),
      color,
    });
  }
}

function floatText(world, x, y, text, color = PALETTE.text) {
  world.texts.push({ x, y, text, color, life: 1.1, maxLife: 1.1 });
}

function addScore(world, n) {
  world.score += n;
}

function scatterCarried(world) {
  const dropped = Math.ceil(world.carried / 2);
  for (let i = 0; i < dropped; i++) {
    const a = world.rng() * Math.PI * 2;
    world.pollen.push({
      x: clamp(world.player.x + Math.cos(a) * 30, 30, VIEW.w - 30),
      y: clamp(world.player.y + Math.sin(a) * 30, 40, VIEW.h - 30),
      vx: Math.cos(a) * 90,
      vy: Math.sin(a) * 90,
      phase: range(world.rng, 0, Math.PI * 2),
      size: 5,
    });
  }
  world.carried -= dropped;
}

function hurtPlayer(world, audio) {
  if (world.invuln > 0 || world.player.dashing > 0) return;
  if (world.shield) {
    world.shield = false;
    world.invuln = 1.2;
    burst(world, world.player.x, world.player.y, '#7fe3c3', 18, 160);
    floatText(world, world.player.x, world.player.y - 30, 'Shield saved you!', '#7fe3c3');
    audio.wispPop();
    return;
  }
  world.lives -= 1;
  world.shake = 14;
  world.flash = 0.5;
  world.invuln = PLAYER.invulnTime;
  world.combo = 0;
  world.comboTimer = 0;
  scatterCarried(world);
  burst(world, world.player.x, world.player.y, '#ff5d73', 26, 200);
  audio.hurt();
  if (world.lives <= 0) {
    endGame(world, audio, false);
  } else {
    showBanner(world, 'The dark bites!', world.lives + (world.lives === 1 ? ' light left' : ' lights left'));
  }
}

function endGame(world, audio, won) {
  world.state = won ? 'win' : 'over';
  world.endedAt = world.time;
  if (world.score > world.best) {
    world.best = world.score;
    try {
      window.localStorage.setItem('mothlight-best', String(world.best));
    } catch {
      // Best score is a nicety; the game plays on without it.
    }
  }
  if (won) {
    audio.win();
    burst(world, BLOOM.x, BLOOM.y, PALETTE.bloom, 60, 260, 4);
  } else {
    audio.lose();
  }
}

function clearWave(world, audio) {
  const timeBonus = Math.round(world.waveTimeLeft) * SCORE.timeBonus;
  const bonus = SCORE.waveBonus * world.wave + timeBonus;
  addScore(world, bonus);
  audio.waveClear();
  burst(world, BLOOM.x, BLOOM.y, PALETTE.bloom, 40, 220, 4);
  if (world.wave >= WAVES.total) {
    endGame(world, audio, true);
    return;
  }
  world.wave += 1;
  world.quota = waveQuota(world.wave);
  world.bankedWave = 0;
  world.waveTimeLeft = WAVES.timePerWave;
  world.wisps.length = 0;
  world.intermission = 1.2;
  showBanner(
    world,
    'Wave ' + world.wave + ' — the dark deepens',
    'Bank ' + world.quota + ' pollen before the night ends',
  );
}

function nightRunsOut(world, audio) {
  world.lives -= 1;
  world.shake = 10;
  world.flash = 0.4;
  world.invuln = PLAYER.invulnTime;
  scatterCarried(world);
  audio.hurt();
  if (world.lives <= 0) {
    endGame(world, audio, false);
    return;
  }
  world.quota = Math.max(6, Math.ceil(world.quota / 2));
  world.bankedWave = 0;
  world.waveTimeLeft = WAVES.timePerWave;
  world.wisps.length = 0;
  showBanner(world, 'Night swallowed the wave', 'A light is lost — the quota is halved');
}

// One fixed update step. `input` is the frame's input snapshot, `audio`
// the synth. Only called while state is 'playing'.
export function updateWorld(world, dt, input, audio) {
  world.time += dt;
  if (world.bannerT > 0) world.bannerT -= dt;
  if (world.shake > 0) world.shake = Math.max(0, world.shake - dt * 30);
  if (world.flash > 0) world.flash = Math.max(0, world.flash - dt * 1.6);
  if (world.intermission > 0) {
    world.intermission -= dt;
    if (world.intermission <= 0) spawnPollen(world, 6);
  }

  const p = world.player;
  const slow = world.slowTimer > 0 ? 0.5 : 1;
  if (world.slowTimer > 0) world.slowTimer -= dt;
  if (world.magnetTimer > 0) world.magnetTimer -= dt;
  if (world.dashCooldown > 0) world.dashCooldown -= dt;
  if (world.invuln > 0) world.invuln -= dt;
  if (world.comboTimer > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) world.combo = 0;
  }

  // --- Player movement and dash ---
  const move = input.moveVector();
  if (p.dashing > 0) {
    p.dashing -= dt;
    p.vx = p.dashX * PLAYER.dashSpeed;
    p.vy = p.dashY * PLAYER.dashSpeed;
    p.trail.push({ x: p.x, y: p.y, life: 0.25 });
  } else {
    p.vx += move.x * PLAYER.accel * dt;
    p.vy += move.y * PLAYER.accel * dt;
    p.vx *= Math.pow(PLAYER.friction, dt * 60);
    p.vy *= Math.pow(PLAYER.friction, dt * 60);
    const speed = Math.hypot(p.vx, p.vy);
    if (speed > PLAYER.maxSpeed) {
      p.vx = (p.vx / speed) * PLAYER.maxSpeed;
      p.vy = (p.vy / speed) * PLAYER.maxSpeed;
    }
    if (speed > 12) p.angle = Math.atan2(p.vy, p.vx);
  }
  p.x = clamp(p.x + p.vx * dt, MARGIN, VIEW.w - MARGIN);
  p.y = clamp(p.y + p.vy * dt, MARGIN + 14, VIEW.h - MARGIN);
  p.flap += dt * (10 + Math.hypot(p.vx, p.vy) * 0.02);
  p.trail.forEach((t) => { t.life -= dt; });
  p.trail = p.trail.filter((t) => t.life > 0);

  if (input.consumeDash() && world.dashCooldown <= 0 && world.charge >= PLAYER.dashCost) {
    const dir = (move.x !== 0 || move.y !== 0)
      ? move
      : { x: Math.cos(p.angle), y: Math.sin(p.angle) };
    p.dashX = dir.x;
    p.dashY = dir.y;
    p.dashing = PLAYER.dashTime;
    world.dashCooldown = PLAYER.dashCooldown;
    world.charge -= PLAYER.dashCost;
    world.stats.dashes += 1;
    burst(world, p.x, p.y, PALETTE.mothWing, 10, 90, 2.5);
    audio.dash();
  }

  // --- Wave timer ---
  world.waveTimeLeft -= dt;
  if (world.waveTimeLeft <= 0) {
    nightRunsOut(world, audio);
    if (world.state !== 'playing') return;
  }

  // --- Pollen spawning, drift and collection ---
  world.pollenTimer -= dt;
  if (world.pollenTimer <= 0) {
    world.pollenTimer = POLLEN.spawnInterval * range(world.rng, 0.8, 1.2);
    spawnPollen(world, 1);
  }
  const magnetR = world.magnetTimer > 0 ? 190 : 0;
  for (let i = world.pollen.length - 1; i >= 0; i--) {
    const o = world.pollen[i];
    o.phase += dt * 2;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.vx *= 0.995;
    o.vy *= 0.995;
    if (o.x < 24 || o.x > VIEW.w - 24) o.vx *= -1;
    if (o.y < 34 || o.y > VIEW.h - 24) o.vy *= -1;
    const d2 = dist2(o.x, o.y, p.x, p.y);
    if (magnetR > 0 && d2 < magnetR * magnetR) {
      const d = Math.sqrt(d2) || 1;
      o.x += ((p.x - o.x) / d) * 260 * dt;
      o.y += ((p.y - o.y) / d) * 260 * dt;
    }
    if (d2 < POLLEN.collectRadius * POLLEN.collectRadius) {
      world.pollen.splice(i, 1);
      world.carried += 1;
      world.combo += 1;
      world.comboTimer = COMBO.window;
      world.maxCombo = Math.max(world.maxCombo, world.combo);
      world.charge = Math.min(100, world.charge + POLLEN.chargeGain);
      world.stats.collected += 1;
      addScore(world, SCORE.collect * comboMult(world.combo));
      burst(world, o.x, o.y, PALETTE.pollen, 6, 70, 2);
      audio.pickup(world.combo);
    }
  }

  // --- Banking at the Heart Bloom ---
  const bloomR = BLOOM.baseRadius + Math.min(26, world.bankedTotal * 0.35);
  const bd2 = dist2(p.x, p.y, BLOOM.x, BLOOM.y);
  if (world.carried > 0 && bd2 < (bloomR + 12) * (bloomR + 12)) {
    const n = world.carried;
    world.bankedWave += n;
    world.bankedTotal += n;
    addScore(world, n * SCORE.bank + (n >= 5 ? 25 : 0));
    floatText(world, BLOOM.x, BLOOM.y - bloomR - 8, '+' + (n * SCORE.bank) + ' banked', PALETTE.bloom);
    burst(world, BLOOM.x, BLOOM.y, PALETTE.bloom, 10 + n * 2, 160, 3);
    world.carried = 0;
    audio.bank(n);
    if (world.bankedWave >= world.quota) {
      clearWave(world, audio);
      if (world.state !== 'playing') return;
    }
  }

  // --- Wisps: spawn, chase, touch and dash-kills ---
  const wispInterval = WISP.spawnInterval - (world.wave - 1) * WISP.spawnStepPerWave;
  world.wispTimer -= dt;
  const wispCap = WISP.maxExtra + world.wave;
  if (world.wispTimer <= 0 && world.wisps.length < wispCap && world.intermission <= 0) {
    world.wispTimer = Math.max(0.9, wispInterval * range(world.rng, 0.8, 1.25));
    spawnWisp(world);
  }
  for (let i = world.wisps.length - 1; i >= 0; i--) {
    const w = world.wisps[i];
    w.phase += dt * 3;
    const dx = p.x - w.x;
    const dy = p.y - w.y;
    const d = Math.hypot(dx, dy) || 1;
    const speed = w.speed * slow;
    if (w.kind === 'lunger') {
      w.lungeT -= dt;
      if (w.lunging > 0) {
        w.lunging -= dt;
        w.x += w.vx * dt;
        w.y += w.vy * dt;
      } else if (w.telegraph > 0) {
        w.telegraph -= dt;
        if (w.telegraph <= 0) {
          w.lunging = 0.45;
          w.vx = (dx / d) * speed * 4.2;
          w.vy = (dy / d) * speed * 4.2;
        }
      } else {
        w.x += (dx / d) * speed * 0.45 * dt;
        w.y += (dy / d) * speed * 0.45 * dt;
        if (w.lungeT <= 0 && d < 260) {
          w.telegraph = 0.5;
          w.lungeT = range(world.rng, 1.6, 2.6);
        }
      }
    } else {
      // Chasers and splitters wobble as they home in, so they never feel
      // like heat-seeking missiles.
      const wob = Math.sin(w.phase * w.wobble) * 0.6;
      const px = -dy / d;
      const py = dx / d;
      w.x += ((dx / d) * speed + px * wob * speed * 0.5) * dt;
      w.y += ((dy / d) * speed + py * wob * speed * 0.5) * dt;
    }
    // Dash scatters a wisp on contact.
    if (p.dashing > 0 && dist2(w.x, w.y, p.x, p.y) < (w.radius + 26) * (w.radius + 26)) {
      world.wisps.splice(i, 1);
      world.stats.wispsScattered += 1;
      world.combo += 2;
      world.comboTimer = COMBO.window;
      addScore(world, SCORE.wisp * comboMult(world.combo));
      burst(world, w.x, w.y, PALETTE.wisp, 16, 170, 3);
      floatText(world, w.x, w.y - 18, '+' + SCORE.wisp * comboMult(world.combo), PALETTE.wispCore);
      audio.wispPop();
      if (w.kind === 'splitter') {
        for (let k = 0; k < 2; k++) {
          world.wisps.push({
            x: w.x + (k === 0 ? -14 : 14), y: w.y,
            vx: 0, vy: 0, kind: 'chaser', radius: 11,
            speed: w.speed * 1.25, phase: range(world.rng, 0, Math.PI * 2),
            lungeT: 0, lunging: 0, telegraph: 0, wobble: 1,
          });
        }
      }
      continue;
    }
    // A wisp's touch hurts, unless the moth is dashing or invulnerable.
    if (world.invuln <= 0 && dist2(w.x, w.y, p.x, p.y) < (w.radius + PLAYER.radius - 4) * (w.radius + PLAYER.radius - 4)) {
      world.wisps.splice(i, 1);
      burst(world, w.x, w.y, PALETTE.wisp, 12, 140, 3);
      hurtPlayer(world, audio);
      if (world.state !== 'playing') return;
    }
  }

  // --- Power-ups ---
  world.powerupTimer -= dt;
  if (world.powerupTimer <= 0) {
    world.powerupTimer = POWERUP.spawnInterval * range(world.rng, 0.9, 1.2);
    spawnPowerup(world);
  }
  for (let i = world.powerups.length - 1; i >= 0; i--) {
    const u = world.powerups[i];
    u.phase += dt * 2;
    u.life -= dt;
    if (u.life <= 0) {
      world.powerups.splice(i, 1);
      continue;
    }
    if (dist2(u.x, u.y, p.x, p.y) < 34 * 34) {
      world.powerups.splice(i, 1);
      world.stats.powerups += 1;
      if (u.kind === 'magnet') {
        world.magnetTimer = POWERUP.magnetTime;
        floatText(world, p.x, p.y - 28, 'Pollen Magnet!', '#7fe3c3');
      } else if (u.kind === 'shield') {
        world.shield = true;
        floatText(world, p.x, p.y - 28, 'Moon Shield!', '#7fe3c3');
      } else {
        world.slowTimer = POWERUP.slowTime;
        floatText(world, p.x, p.y - 28, 'Slow Night!', '#7fe3c3');
      }
      burst(world, u.x, u.y, '#7fe3c3', 14, 130, 3);
      audio.powerup();
    }
  }

  // --- Ambient drift: petals and fireflies keep moving even mid-game ---
  for (const petal of world.petals) {
    petal.y += petal.vy * dt;
    petal.x += Math.sin(world.time * petal.sway + petal.phase) * 12 * dt;
    if (petal.y > VIEW.h + 8) {
      petal.y = -8;
      petal.x = range(world.rng, 0, VIEW.w);
    }
  }
  for (const f of world.fireflies) {
    f.phase += dt * f.speed;
    f.x += Math.sin(f.phase) * 8 * dt;
    f.y += Math.cos(f.phase * 0.7) * 6 * dt;
  }

  // --- Particles and floating texts decay ---
  for (let i = world.particles.length - 1; i >= 0; i--) {
    const pt = world.particles[i];
    pt.life -= dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vx *= 0.98;
    pt.vy *= 0.98;
    if (pt.life <= 0) world.particles.splice(i, 1);
  }
  for (let i = world.texts.length - 1; i >= 0; i--) {
    const t = world.texts[i];
    t.life -= dt;
    t.y -= 26 * dt;
    if (t.life <= 0) world.texts.splice(i, 1);
  }
}

export { BLOOM };
