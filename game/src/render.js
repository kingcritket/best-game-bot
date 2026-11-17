// Mothlight — rendering: the night garden, the moth, the wisps, the HUD
// and every screen, all drawn on one canvas. No images are loaded; every
// flower, wing and glow is drawn here, so the game needs no network.

import { VIEW, PALETTE, PLAYER, WAVES, COMBO, CARRY, GREED } from './config.js';
import { BLOOM, comboMult, waveQuota } from './world.js';
import { drawBoss } from './boss.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = '700') {
  ctx.font = weight + ' ' + size + 'px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function drawBackground(ctx, world) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW.h);
  g.addColorStop(0, PALETTE.skyTop);
  g.addColorStop(0.55, PALETTE.skyMid);
  g.addColorStop(1, PALETTE.skyBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);

  // Stars, fixed by the seeded stream's index so they never twinkle alike.
  ctx.save();
  for (let i = 0; i < 70; i++) {
    const sx = (i * 137.5) % VIEW.w;
    const sy = (i * 89.3) % 260;
    const tw = 0.35 + 0.35 * Math.sin(world.time * 1.4 + i * 1.7);
    ctx.globalAlpha = Math.max(0.08, tw);
    ctx.fillStyle = '#e8e4ff';
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.restore();

  // The garden floor: a soft hill of dark grass at the bottom.
  ctx.fillStyle = PALETTE.ground;
  ctx.beginPath();
  ctx.moveTo(0, VIEW.h);
  ctx.lineTo(0, VIEW.h - 74);
  ctx.quadraticCurveTo(VIEW.w * 0.3, VIEW.h - 118, VIEW.w * 0.55, VIEW.h - 82);
  ctx.quadraticCurveTo(VIEW.w * 0.8, VIEW.h - 52, VIEW.w, VIEW.h - 92);
  ctx.lineTo(VIEW.w, VIEW.h);
  ctx.closePath();
  ctx.fill();

  // A low moon, the garden's only lamp besides the bloom.
  ctx.save();
  const moon = ctx.createRadialGradient(828, 84, 8, 828, 84, 90);
  moon.addColorStop(0, 'rgba(255, 244, 200, 0.9)');
  moon.addColorStop(0.45, 'rgba(255, 240, 190, 0.28)');
  moon.addColorStop(1, 'rgba(255, 240, 190, 0)');
  ctx.fillStyle = moon;
  ctx.beginPath();
  ctx.arc(828, 84, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fdf3c8';
  ctx.beginPath();
  ctx.arc(828, 84, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(214, 196, 150, 0.55)';
  ctx.beginPath();
  ctx.arc(816, 74, 7, 0, Math.PI * 2);
  ctx.arc(840, 94, 5, 0, Math.PI * 2);
  ctx.arc(830, 66, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Distant pine silhouettes rooted on the hill.
  ctx.save();
  ctx.fillStyle = 'rgba(10, 14, 38, 0.85)';
  for (let i = 0; i < 9; i++) {
    const tx = 20 + i * 108 + (i % 3) * 22;
    const th = 46 + (i % 4) * 14;
    const ty = VIEW.h - 60;
    ctx.beginPath();
    ctx.moveTo(tx - 16, ty);
    ctx.lineTo(tx, ty - th);
    ctx.lineTo(tx + 16, ty);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Drifting petals behind everything.
  for (const petal of world.petals) {
    ctx.save();
    ctx.translate(petal.x, petal.y);
    ctx.rotate(Math.sin(world.time + petal.phase) * 0.8);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = petal.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, petal.size, petal.size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Glowing flowers, pulsing gently.
  for (const f of world.flowers) {
    const pulse = 0.75 + 0.25 * Math.sin(world.time * 1.6 + f.phase);
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.globalAlpha = 0.42 * pulse;
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.arc(0, 0, f.r * 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.95;
    for (let k = 0; k < f.petals; k++) {
      const a = (k / f.petals) * Math.PI * 2 + f.phase * 0.1;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * f.r * 0.7, Math.sin(a) * f.r * 0.7, f.r * 0.55, f.r * 0.3, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(0, 0, f.r * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Fireflies.
  for (const f of world.fireflies) {
    const glow = 0.25 + 0.55 * Math.abs(Math.sin(f.phase * 2));
    ctx.save();
    ctx.globalAlpha = glow;
    ctx.fillStyle = '#ffe66d';
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawBloom(ctx, world) {
  const progress = Math.min(1, world.bankedTotal / (waveQuota(WAVES.total) * 0.6 + world.bankedTotal * 0.4 + 1));
  const r = BLOOM.baseRadius + Math.min(26, world.bankedTotal * 0.35);
  const pulse = 1 + 0.05 * Math.sin(world.time * 2.2);
  ctx.save();
  ctx.translate(BLOOM.x, BLOOM.y);
  ctx.scale(pulse, pulse);

  const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, r * 2.4);
  halo.addColorStop(0, 'rgba(255, 209, 102, 0.4)');
  halo.addColorStop(1, 'rgba(255, 209, 102, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.4, 0, Math.PI * 2);
  ctx.fill();

  // Eight petals that open wider as the garden is banked up.
  const open = 0.5 + progress * 0.5;
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + world.time * 0.08;
    ctx.save();
    ctx.rotate(a);
    ctx.fillStyle = k % 2 === 0 ? PALETTE.bloom : PALETTE.bloomPetal;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.ellipse(r * 0.62 * open, 0, r * 0.5, r * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = PALETTE.bloomCore;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c98a2e';
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + 0.4;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // On the title screen the goal panel sits over the bloom: hide its label
  // there so no text is half-covered.
  if (world.state !== 'title') text(ctx, 'HEART BLOOM', BLOOM.x, BLOOM.y + r + 20, 11, PALETTE.dim, 'center', '600');
}

function drawPollen(ctx, world) {
  for (const o of world.pollen) {
    const bob = Math.sin(o.phase) * 2;
    ctx.save();
    ctx.translate(o.x, o.y + bob);
    const haloR = o.golden ? 22 : 16;
    const halo = ctx.createRadialGradient(0, 0, 1, 0, 0, haloR);
    halo.addColorStop(0, o.golden ? 'rgba(255, 209, 102, 0.6)' : PALETTE.pollenHalo);
    halo.addColorStop(1, 'rgba(255, 230, 109, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.fill();
    if (o.golden) {
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.8)';
      ctx.lineWidth = 1.5;
      for (let k = 0; k < 4; k++) {
        const a = o.phase + (k * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 9, Math.sin(a) * 9);
        ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
        ctx.stroke();
      }
    }
    ctx.fillStyle = o.golden ? '#fff3c4' : PALETTE.pollen;
    ctx.beginPath();
    ctx.arc(0, 0, o.golden ? o.size + 1.5 : o.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fffbe0';
    ctx.beginPath();
    ctx.arc(-1.5, -1.5, o.size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawWisps(ctx, world) {
  // Orbiters guard the bloom: show their patrol ring so the player can
  // read the danger before flying into it.
  const orbiter = world.wisps.find((w) => w.kind === 'orbiter');
  if (orbiter) {
    ctx.save();
    ctx.setLineDash([6, 8]);
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(BLOOM.x, BLOOM.y, orbiter.orbitR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  for (const w of world.wisps) {
    const wob = Math.sin(w.phase) * 2;
    ctx.save();
    ctx.translate(w.x, w.y + wob);
    const flash = w.telegraph > 0 ? (Math.sin(world.time * 30) > 0 ? 1 : 0.4) : 1;
    // Stalkers fade in and out — their alpha is the tell.
    ctx.globalAlpha = 0.9 * flash * (w.kind === 'stalker' ? (w.alpha ?? 1) : 1);
    const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, w.radius * 2.2);
    halo.addColorStop(0, 'rgba(139, 127, 240, 0.5)');
    halo.addColorStop(1, 'rgba(139, 127, 240, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, w.radius * 2.2, 0, Math.PI * 2);
    ctx.fill();
    // Smoky body with a ragged edge.
    ctx.fillStyle = w.kind === 'lunger' ? '#6a5fd0' : w.kind === 'orbiter' ? '#a78bfa' : w.kind === 'stalker' ? '#7a6fd0' : PALETTE.wisp;
    ctx.beginPath();
    for (let k = 0; k <= 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      const rr = w.radius * (1 + 0.16 * Math.sin(a * 3 + w.phase));
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.wispCore;
    ctx.beginPath();
    ctx.arc(0, -2, w.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
    // Two eyes that track the moth.
    const dx = world.player.x - w.x;
    const dy = world.player.y - w.y;
    const d = Math.hypot(dx, dy) || 1;
    const ex = (dx / d) * 3;
    const ey = (dy / d) * 3;
    ctx.fillStyle = PALETTE.wispEye;
    ctx.beginPath();
    ctx.arc(-5 + ex, -4 + ey, 2.6, 0, Math.PI * 2);
    ctx.arc(5 + ex, -4 + ey, 2.6, 0, Math.PI * 2);
    ctx.fill();
    if (w.kind === 'splitter') {
      ctx.strokeStyle = 'rgba(207, 198, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, w.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (w.kind === 'orbiter') {
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, w.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (w.kind === 'stalker') {
      ctx.strokeStyle = 'rgba(207, 198, 255, 0.35)';
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, w.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawPowerups(ctx, world) {
  for (const u of world.powerups) {
    const blink = u.life < 3 ? (Math.sin(world.time * 12) > 0 ? 1 : 0.25) : 1;
    ctx.save();
    ctx.translate(u.x, u.y + Math.sin(u.phase) * 3);
    ctx.globalAlpha = blink;
    const nova = u.kind === 'nova';
    const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, nova ? 34 : 26);
    halo.addColorStop(0, nova ? 'rgba(255, 209, 102, 0.55)' : 'rgba(127, 227, 195, 0.45)');
    halo.addColorStop(1, nova ? 'rgba(255, 209, 102, 0)' : 'rgba(127, 227, 195, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, nova ? 34 : 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = nova ? '#3a2c08' : '#123b31';
    ctx.strokeStyle = nova ? '#ffd166' : '#7fe3c3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, nova ? 15 : 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = nova ? '#ffd166' : '#7fe3c3';
    ctx.font = '700 13px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(u.kind === 'magnet' ? 'M' : u.kind === 'shield' ? 'S' : u.kind === 'nova' ? 'N' : 'T', 0, 1);
    ctx.restore();
  }
}

function drawPlayer(ctx, world) {
  const p = world.player;
  // Dash trail.
  for (const t of p.trail) {
    ctx.save();
    ctx.globalAlpha = t.life * 2.2;
    ctx.fillStyle = PALETTE.mothWing;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  const blink = world.invuln > 0 && Math.sin(world.time * 24) > 0;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.globalAlpha = blink ? 0.35 : 1;
  // Glow aura, brighter with charge.
  const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 58 + world.charge * 0.28);
  aura.addColorStop(0, 'rgba(255, 230, 140, ' + (0.32 + world.charge * 0.002) + ')');
  aura.addColorStop(1, 'rgba(255, 230, 140, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, 58 + world.charge * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(p.angle + Math.PI / 2);
  const flap = Math.sin(p.flap) * 0.55;
  // Wings.
  ctx.fillStyle = PALETTE.mothWing;
  ctx.beginPath();
  ctx.ellipse(-11, -4, 15, 9.5 + flap * 7, -0.5 - flap * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(11, -4, 15, 9.5 + flap * 7, 0.5 + flap * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.mothWingDeep;
  ctx.beginPath();
  ctx.ellipse(-10, 6, 10.5, 7, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(10, 6, 10.5, 7, 0.4, 0, Math.PI * 2);
  ctx.fill();
  // Body.
  ctx.fillStyle = '#5b4636';
  ctx.beginPath();
  ctx.ellipse(0, 0, 5.5, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.moth;
  ctx.beginPath();
  ctx.arc(0, -11, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b2118';
  ctx.beginPath();
  ctx.arc(-2, -12, 1.4, 0, Math.PI * 2);
  ctx.arc(2, -12, 1.4, 0, Math.PI * 2);
  ctx.fill();
  // Antennae.
  ctx.strokeStyle = '#5b4636';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-2, -15);
  ctx.quadraticCurveTo(-7, -22, -9, -24);
  ctx.moveTo(2, -15);
  ctx.quadraticCurveTo(7, -22, 9, -24);
  ctx.stroke();
  ctx.restore();

  // Shield ring.
  if (world.shield) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.strokeStyle = 'rgba(127, 227, 195, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 24 + Math.sin(world.time * 4) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawParticles(ctx, world) {
  for (const pt of world.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Dash shockwave rings, expanding and fading.
  for (const r of world.rings) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, r.life / r.maxLife) * 0.8;
    ctx.strokeStyle = '#ffe66d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  for (const t of world.texts) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
    text(ctx, t.text, t.x, t.y, 15, t.color, 'center');
    ctx.restore();
  }
}

function drawHUD(ctx, world) {
  ctx.save();
  ctx.fillStyle = PALETTE.hudBg;
  roundRect(ctx, 0, 0, VIEW.w, 46, 0);
  ctx.fill();
  ctx.strokeStyle = PALETTE.hudLine;
  ctx.beginPath();
  ctx.moveTo(0, 46.5);
  ctx.lineTo(VIEW.w, 46.5);
  ctx.stroke();

  text(ctx, 'SCORE  ' + world.score, 16, 24, 18, PALETTE.text);
  // Wave quota progress.
  const qx = 250;
  const qw = 210;
  text(ctx, 'WAVE ' + world.wave + '/' + WAVES.total, qx, 15, 12, PALETTE.dim);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  roundRect(ctx, qx, 22, qw, 10, 5);
  ctx.fill();
  ctx.fillStyle = PALETTE.bloom;
  const frac = Math.min(1, world.bankedWave / world.quota);
  roundRect(ctx, qx, 22, qw * frac, 10, 5);
  ctx.fill();
  text(ctx, world.bankedWave + '/' + world.quota + ' banked', qx + qw + 10, 27, 12, PALETTE.text);

  // Night timer — or the boss hunt, once the quota is banked on wave 8.
  if (world.bossPhase) {
    text(ctx, 'BREAK THE SOVEREIGN', 560, 24, 16, PALETTE.bloom);
  } else {
    const t = Math.max(0, Math.ceil(world.waveTimeLeft));
    const tc = t <= 10 ? '#ff5d73' : PALETTE.text;
    text(ctx, 'NIGHT ' + t + 's', 560, 24, 16, tc);
  }

  // Lives as hearts.
  for (let i = 0; i < PLAYER.lives; i++) {
    const hx = 700 + i * 26;
    const hy = 24;
    ctx.fillStyle = i < world.lives ? PALETTE.heart : PALETTE.heartEmpty;
    ctx.beginPath();
    ctx.moveTo(hx, hy + 6);
    ctx.bezierCurveTo(hx - 9, hy - 2, hx - 5, hy - 10, hx, hy - 4);
    ctx.bezierCurveTo(hx + 5, hy - 10, hx + 9, hy - 2, hx, hy + 6);
    ctx.fill();
  }

  // Carried pollen and combo. A heavy load (8+) slows the moth — the HUD
  // says so, and that banking 8+ at once pays the Greed Bonus.
  const heavy = world.carried >= CARRY.heavyAt;
  text(ctx, heavy ? 'CARRYING ' + world.carried + ' — HEAVY!' : 'CARRYING ' + world.carried, 800, 16, 12, heavy ? '#ff5d73' : PALETTE.pollen, 'left', '600');
  if (world.combo >= 3) {
    text(ctx, 'COMBO x' + comboMult(world.combo) + ' (' + world.combo + ')', 800, 34, 12, '#7fe3c3');
    // Combo countdown bar: the chain only lives while the bar does.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    roundRect(ctx, 800, 41, 120, 4, 2);
    ctx.fill();
    ctx.fillStyle = '#7fe3c3';
    roundRect(ctx, 800, 41, 120 * Math.max(0, world.comboTimer / COMBO.window), 4, 2);
    ctx.fill();
  } else if (heavy) {
    text(ctx, 'GREED BONUS READY — BANK ' + GREED.threshold + '+!', 800, 34, 11, PALETTE.bloom, 'left', '600');
  } else {
    text(ctx, 'BANK AT THE BLOOM', 800, 34, 11, PALETTE.dim, 'left', '600');
  }
  ctx.restore();

  // Charge bar (dash fuel), bottom centre.
  const bw = 180;
  const bx = (VIEW.w - bw) / 2;
  const by = VIEW.h - 24;
  ctx.save();
  ctx.fillStyle = 'rgba(9, 11, 32, 0.6)';
  roundRect(ctx, bx - 8, by - 8, bw + 16, 20, 8);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  roundRect(ctx, bx, by - 3, bw, 6, 3);
  ctx.fill();
  ctx.fillStyle = world.charge >= PLAYER.dashCost ? PALETTE.mothWing : '#ff5d73';
  roundRect(ctx, bx, by - 3, bw * (world.charge / 100), 6, 3);
  ctx.fill();
  text(ctx, 'DASH  [SPACE]', bx + bw + 12, by, 11, PALETTE.dim, 'left', '600');
  if (world.magnetTimer > 0) text(ctx, 'MAGNET ' + Math.ceil(world.magnetTimer) + 's', 16, VIEW.h - 16, 12, '#7fe3c3');
  if (world.slowTimer > 0) text(ctx, 'SLOW NIGHT ' + Math.ceil(world.slowTimer) + 's', 16, VIEW.h - 34, 12, '#7fe3c3');
  ctx.restore();

  // Boss health bar, while the Sovereign lives.
  if (world.boss) {
    ctx.save();
    const bw = 220;
    const bx = (VIEW.w - bw) / 2;
    const by = 56;
    ctx.fillStyle = 'rgba(9, 11, 32, 0.6)';
    roundRect(ctx, bx - 10, by - 4, bw + 20, 26, 8);
    ctx.fill();
    text(ctx, 'NIGHT SOVEREIGN', VIEW.w / 2, by + 6, 11, '#cfc6ff', 'center', '700');
    for (let i = 0; i < world.boss.maxHp; i++) {
      ctx.fillStyle = i < world.boss.hp ? '#8b7ff0' : 'rgba(255, 255, 255, 0.16)';
      ctx.beginPath();
      ctx.arc(bx + 14 + i * ((bw - 28) / 5), by + 18, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Wave banner.
  if (world.banner && world.bannerT > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, world.bannerT);
    text(ctx, world.banner.text, VIEW.w / 2, 96, 30, PALETTE.text, 'center');
    if (world.banner.sub) text(ctx, world.banner.sub, VIEW.w / 2, 126, 15, PALETTE.dim, 'center', '600');
    ctx.restore();
  }
}

function dimScreen(ctx) {
  ctx.fillStyle = 'rgba(6, 8, 24, 0.72)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
}

function drawTitle(ctx, world) {
  dimScreen(ctx);
  // Title moth emblem.
  ctx.save();
  ctx.translate(VIEW.w / 2, 118);
  const flap = Math.sin(world.time * 6) * 0.5;
  ctx.fillStyle = PALETTE.mothWing;
  ctx.beginPath();
  ctx.ellipse(-26, 0, 30, 18 + flap * 8, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(26, 0, 30, 18 + flap * 8, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5b4636';
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  text(ctx, 'MOTHLIGHT', VIEW.w / 2, 188, 58, PALETTE.text, 'center');
  text(ctx, 'Garden of the Last Lantern', VIEW.w / 2, 228, 20, PALETTE.bloom, 'center', '600');

  // The whole game, readable in one glance: goal, win, lose.
  ctx.save();
  ctx.fillStyle = 'rgba(9, 11, 32, 0.72)';
  roundRect(ctx, 170, 252, 620, 96, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.45)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 170, 252, 620, 96, 12);
  ctx.stroke();
  text(ctx, 'GOAL — Gather glowpollen, bank it at the Heart Bloom', 192, 276, 15, PALETTE.text, 'left', '600');
  text(ctx, 'WIN  —  Clear all 8 waves & break the Night Sovereign', 192, 302, 15, PALETTE.bloom, 'left', '600');
  text(ctx, 'LOSE — Lose all 3 lights to wisps or to the night', 192, 328, 15, '#ff8fa0', 'left', '600');
  ctx.restore();

  text(ctx, 'MOVE', VIEW.w / 2 - 190, 392, 14, PALETTE.bloom, 'center');
  text(ctx, 'WASD / Arrows', VIEW.w / 2 - 190, 416, 14, PALETTE.text, 'center', '600');
  text(ctx, 'DASH (scatters wisps)', VIEW.w / 2, 392, 14, PALETTE.bloom, 'center');
  text(ctx, 'SPACE or Click', VIEW.w / 2, 416, 14, PALETTE.text, 'center', '600');
  text(ctx, 'PAUSE / MUTE', VIEW.w / 2 + 190, 392, 14, PALETTE.bloom, 'center');
  text(ctx, 'P / M', VIEW.w / 2 + 190, 416, 14, PALETTE.text, 'center', '600');

  const pulse = 0.7 + 0.3 * Math.sin(world.time * 4);
  ctx.save();
  ctx.globalAlpha = pulse;
  text(ctx, 'Press ENTER or click to begin', VIEW.w / 2, 470, 20, PALETTE.text, 'center');
  ctx.restore();
  if (world.best > 0) text(ctx, 'Best score: ' + world.best, VIEW.w / 2, 504, 14, PALETTE.dim, 'center', '600');
  text(ctx, 'Tip: banking 8+ pollen at once pays a Greed Bonus — but a heavy moth flies slower.', VIEW.w / 2, 540, 13, PALETTE.dim, 'center', '600');
}

function statLine(ctx, label, value, y) {
  text(ctx, label, VIEW.w / 2 - 130, y, 16, PALETTE.dim, 'left', '600');
  text(ctx, String(value), VIEW.w / 2 + 130, y, 16, PALETTE.text, 'right');
}

function drawRestartPill(ctx, world, y) {
  const pulse = 0.7 + 0.3 * Math.sin(world.time * 4);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = 'rgba(255, 209, 102, 0.16)';
  roundRect(ctx, VIEW.w / 2 - 150, y - 21, 300, 42, 21);
  ctx.fill();
  ctx.strokeStyle = PALETTE.bloom;
  ctx.lineWidth = 2;
  roundRect(ctx, VIEW.w / 2 - 150, y - 21, 300, 42, 21);
  ctx.stroke();
  text(ctx, '↻  PLAY AGAIN  —  press R', VIEW.w / 2, y, 18, PALETTE.text, 'center');
  ctx.restore();
}

function drawWin(ctx, world) {
  dimScreen(ctx);
  text(ctx, 'THE GARDEN BLOOMS', VIEW.w / 2, 118, 44, PALETTE.bloom, 'center');
  text(ctx, 'Every wave cleared — Luma’s light fills the night garden.', VIEW.w / 2, 166, 17, PALETTE.text, 'center', '600');
  statLine(ctx, 'FINAL SCORE', world.score, 232);
  statLine(ctx, 'POLLEN BANKED', world.bankedTotal, 262);
  statLine(ctx, 'WISPS SCATTERED', world.stats.wispsScattered, 292);
  statLine(ctx, 'BEST COMBO', world.maxCombo, 322);
  statLine(ctx, 'DASHES', world.stats.dashes, 352);
  statLine(ctx, 'POWER-UPS', world.stats.powerups, 382);
  statLine(ctx, 'TIME', Math.round(world.endedAt) + 's', 412);
  if (world.score >= world.best && world.score > 0) {
    text(ctx, '★ NEW BEST SCORE ★', VIEW.w / 2, 452, 18, PALETTE.bloom, 'center');
  }
  drawRestartPill(ctx, world, 512);
}

function drawOver(ctx, world) {
  dimScreen(ctx);
  text(ctx, 'THE LIGHT GOES OUT', VIEW.w / 2, 118, 42, '#ff5d73', 'center');
  text(ctx, 'The wisps close in and the garden sleeps in darkness.', VIEW.w / 2, 166, 17, PALETTE.text, 'center', '600');
  statLine(ctx, 'SCORE', world.score, 232);
  statLine(ctx, 'WAVE REACHED', world.wave + ' / ' + WAVES.total, 262);
  statLine(ctx, 'POLLEN BANKED', world.bankedTotal, 292);
  statLine(ctx, 'WISPS SCATTERED', world.stats.wispsScattered, 322);
  statLine(ctx, 'DASHES', world.stats.dashes, 352);
  statLine(ctx, 'POWER-UPS', world.stats.powerups, 382);
  statLine(ctx, 'BEST SCORE', world.best, 412);
  drawRestartPill(ctx, world, 496);
}

function drawPause(ctx, world) {
  dimScreen(ctx);
  text(ctx, 'PAUSED', VIEW.w / 2, 220, 40, PALETTE.text, 'center');
  text(ctx, 'Press P to keep playing — M mutes the music', VIEW.w / 2, 272, 16, PALETTE.dim, 'center', '600');
  text(ctx, 'WASD move  ·  SPACE dash  ·  R restarts the run', VIEW.w / 2, 306, 15, PALETTE.text, 'center', '600');
  text(ctx, 'Bank the quota at the Heart Bloom before the night runs out.', VIEW.w / 2, 336, 14, PALETTE.dim, 'center', '600');
}

// The vignette closes in as the night timer runs low: the garden literally
// darkens while the player dawdles.
function drawVignette(ctx, world) {
  const urgency = world.state === 'playing'
    ? 1 - Math.max(0, world.waveTimeLeft) / WAVES.timePerWave
    : 0;
  const inner = 0.62 - urgency * 0.22;
  const g = ctx.createRadialGradient(
    VIEW.w / 2, VIEW.h / 2, VIEW.h * inner * 0.55,
    VIEW.w / 2, VIEW.h / 2, VIEW.h * 0.78,
  );
  g.addColorStop(0, 'rgba(4, 5, 18, 0)');
  g.addColorStop(1, 'rgba(4, 5, 18, ' + (0.5 + urgency * 0.25) + ')');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  if (world.flash > 0) {
    ctx.fillStyle = 'rgba(255, 93, 115, ' + world.flash * 0.35 + ')';
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  }
  // The last ten seconds of a wave pulse red at the edges.
  if (world.state === 'playing' && !world.bossPhase && world.waveTimeLeft <= 10) {
    const pulse = 0.1 + 0.08 * Math.sin(world.time * 6);
    ctx.fillStyle = 'rgba(255, 93, 115, ' + pulse + ')';
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  }
}

export function render(ctx, world) {
  ctx.save();
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
  }
  drawBackground(ctx, world);
  drawBloom(ctx, world);
  drawPollen(ctx, world);
  drawPowerups(ctx, world);
  drawWisps(ctx, world);
  if (world.boss) drawBoss(ctx, world);
  drawPlayer(ctx, world);
  drawParticles(ctx, world);
  drawVignette(ctx, world);
  if (world.state === 'playing' || world.state === 'paused') drawHUD(ctx, world);
  if (world.state === 'title') drawTitle(ctx, world);
  if (world.state === 'paused') drawPause(ctx, world);
  if (world.state === 'win') drawWin(ctx, world);
  if (world.state === 'over') drawOver(ctx, world);
  ctx.restore();
}
