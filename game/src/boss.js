// Mothlight — the Night Sovereign, the boss of wave 8.
// A great shadow-wisp with six hit points: only a dash can crack it.
// It chases slowly, lunges with a telegraphed wind-up, and calls chaser
// wisps to its side. The garden is won when the quota is banked and the
// Sovereign is broken.

import { PALETTE, BOSS, WISP } from './config.js';
import { range, clamp } from './random.js';

export function createBoss(world) {
  return {
    kind: 'sovereign',
    x: 480,
    y: 120,
    vx: 0,
    vy: 0,
    radius: BOSS.radius,
    hp: BOSS.hp,
    maxHp: BOSS.hp,
    speed: BOSS.speed,
    phase: range(world.rng, 0, Math.PI * 2),
    summonT: BOSS.summonInterval,
    lungeT: 2,
    lunging: 0,
    telegraph: 0,
    flashT: 0,
    lastDash: -1,
    wobble: 1.1,
  };
}

// Moves the boss and reports what happened this step: { dashHit } when a
// dash cracked it, { touched } when it reached the moth. The caller
// (world.js) owns damage, score and the win, so this file never imports
// the world.
export function updateBoss(world, dt, audio) {
  const boss = world.boss;
  const p = world.player;
  const slow = world.slowTimer > 0 ? 0.5 : 1;
  const events = {};
  boss.phase += dt * 3;
  if (boss.flashT > 0) boss.flashT -= dt;
  if (boss.summonT > 0) boss.summonT -= dt;

  const dx = p.x - boss.x;
  const dy = p.y - boss.y;
  const d = Math.hypot(dx, dy) || 1;
  const speed = boss.speed * slow;

  if (boss.lunging > 0) {
    boss.lunging -= dt;
    boss.x += boss.vx * dt;
    boss.y += boss.vy * dt;
  } else if (boss.telegraph > 0) {
    boss.telegraph -= dt;
    if (boss.telegraph <= 0) {
      boss.lunging = BOSS.lungeTime;
      boss.vx = (dx / d) * speed * BOSS.lungeMult;
      boss.vy = (dy / d) * speed * BOSS.lungeMult;
    }
  } else {
    const wob = Math.sin(boss.phase * boss.wobble) * 0.5;
    const px = -dy / d;
    const py = dx / d;
    boss.x += ((dx / d) * speed + px * wob * speed * 0.5) * dt;
    boss.y += ((dy / d) * speed + py * wob * speed * 0.5) * dt;
    boss.lungeT -= dt;
    if (boss.lungeT <= 0 && d < BOSS.lungeRange) {
      boss.telegraph = BOSS.lungeWindup;
      boss.lungeT = range(world.rng, 2.2, 3.2);
      audio.roar();
    }
  }
  boss.x = clamp(boss.x, 30, 930);
  boss.y = clamp(boss.y, 44, 570);

  // Call in chasers while the fight lasts.
  if (boss.summonT <= 0 && world.wisps.length < 8) {
    boss.summonT = BOSS.summonInterval * range(world.rng, 0.9, 1.2);
    const a = world.rng() * Math.PI * 2;
    world.wisps.push({
      x: clamp(boss.x + Math.cos(a) * 60, 20, 940),
      y: clamp(boss.y + Math.sin(a) * 60, 40, 580),
      vx: 0, vy: 0, kind: 'chaser', radius: 16,
      speed: (WISP.baseSpeed + (world.wave - 1) * WISP.speedPerWave) * range(world.rng, 0.9, 1.1),
      phase: range(world.rng, 0, Math.PI * 2),
      lungeT: 0, lunging: 0, telegraph: 0, wobble: 1,
    });
  }

  // A dash cracks the Sovereign — once per dash.
  if (p.dashing > 0 && world.stats.dashes !== boss.lastDash
    && (boss.x - p.x) * (boss.x - p.x) + (boss.y - p.y) * (boss.y - p.y) < (boss.radius + 26) * (boss.radius + 26)) {
    boss.lastDash = world.stats.dashes;
    events.dashHit = true;
  }
  // Its touch hurts, unless the moth is dashing or untouchable.
  if (world.invuln <= 0 && p.dashing <= 0
    && (boss.x - p.x) * (boss.x - p.x) + (boss.y - p.y) * (boss.y - p.y) < (boss.radius + 10) * (boss.radius + 10)) {
    events.touched = true;
  }
  return events;
}

export function drawBoss(ctx, world) {
  const boss = world.boss;
  if (!boss) return;
  const wob = Math.sin(boss.phase) * 2;
  ctx.save();
  ctx.translate(boss.x, boss.y + wob);
  const flash = boss.telegraph > 0 ? (Math.sin(world.time * 30) > 0 ? 1 : 0.45) : 1;
  ctx.globalAlpha = 0.95 * flash;

  // Halo.
  const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, boss.radius * 2.4);
  halo.addColorStop(0, 'rgba(120, 100, 230, 0.55)');
  halo.addColorStop(1, 'rgba(120, 100, 230, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, boss.radius * 2.4, 0, Math.PI * 2);
  ctx.fill();

  // Crown of thorns.
  ctx.fillStyle = '#3d3480';
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a - 0.12) * boss.radius * 0.8, Math.sin(a - 0.12) * boss.radius * 0.8);
    ctx.lineTo(Math.cos(a) * (boss.radius + 14), Math.sin(a) * (boss.radius + 14));
    ctx.lineTo(Math.cos(a + 0.12) * boss.radius * 0.8, Math.sin(a + 0.12) * boss.radius * 0.8);
    ctx.closePath();
    ctx.fill();
  }

  // Ragged body — flashes pale when a dash cracks it.
  ctx.fillStyle = boss.flashT > 0 ? '#e8e4ff' : '#5a4fd0';
  ctx.beginPath();
  for (let k = 0; k <= 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const rr = boss.radius * (1 + 0.14 * Math.sin(a * 3 + boss.phase));
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr;
    if (k === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Core and two eyes that track the moth.
  ctx.fillStyle = PALETTE.wispCore;
  ctx.beginPath();
  ctx.arc(0, -2, boss.radius * 0.42, 0, Math.PI * 2);
  ctx.fill();
  const dx = world.player.x - boss.x;
  const dy = world.player.y - boss.y;
  const d = Math.hypot(dx, dy) || 1;
  const ex = (dx / d) * 4;
  const ey = (dy / d) * 4;
  ctx.fillStyle = PALETTE.wispEye;
  ctx.beginPath();
  ctx.arc(-9 + ex, -6 + ey, 4, 0, Math.PI * 2);
  ctx.arc(9 + ex, -6 + ey, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
