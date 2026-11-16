// Mothlight — bootstrap and the main loop.
// Sets the canvas to the game's 960x600 logical size, runs a fixed-clamp
// requestAnimationFrame loop, routes keys to the state machine (title,
// playing, paused, win, over), and exposes a tiny read-only debug hook
// (window.__mothlight) so automated play-tests can watch the state.

import { VIEW } from './config.js';
import { createWorld, startGame, updateWorld } from './world.js';
import { render } from './render.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { stageShot, readShotQuery } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const audio = createAudio();
const statusEl = document.getElementById('status');

function fitCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = VIEW.w * dpr;
  canvas.height = VIEW.h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

const shot = readShotQuery();
let world = shot ? stageShot(shot.shot, shot.seed) : createWorld(20261116);
let last = performance.now();
let frozen = Boolean(shot);

function announce() {
  if (!statusEl) return;
  const s = world.state;
  statusEl.textContent =
    s === 'title' ? 'Mothlight: press Enter to begin.'
    : s === 'playing' ? 'Wave ' + world.wave + ', score ' + world.score + ', ' + world.lives + ' lives.'
    : s === 'paused' ? 'Paused.'
    : s === 'win' ? 'You won! Final score ' + world.score + '.'
    : 'Game over. Final score ' + world.score + '.';
}

function beginFromTitle() {
  audio.ensure();
  audio.startMusic();
  audio.click();
  startGame(world);
  // The key or click that started the game must not also fire a dash.
  input.endFrame();
  announce();
}

function restart() {
  audio.ensure();
  audio.click();
  startGame(world);
  input.endFrame();
  announce();
}

window.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  if (event.code === 'KeyM') {
    audio.ensure();
    audio.setMuted(!audio.muted);
    return;
  }
  if (world.state === 'title') {
    if (event.code === 'Enter' || event.code === 'Space') beginFromTitle();
    return;
  }
  if (world.state === 'playing') {
    if (event.code === 'KeyP' || event.code === 'Escape') {
      world.state = 'paused';
      audio.click();
      announce();
    }
    return;
  }
  if (world.state === 'paused') {
    if (event.code === 'KeyP' || event.code === 'Escape' || event.code === 'Enter') {
      world.state = 'playing';
      audio.click();
      announce();
    }
    return;
  }
  if (world.state === 'win' || world.state === 'over') {
    if (event.code === 'KeyR' || event.code === 'Enter' || event.code === 'Space') restart();
  }
});

canvas.addEventListener('pointerdown', () => {
  if (world.state === 'title') beginFromTitle();
  else if (world.state === 'win' || world.state === 'over') restart();
});

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!frozen) {
    if (world.state === 'playing') {
      updateWorld(world, dt, input, audio);
      if (world.state === 'win' || world.state === 'over') announce();
    } else if (world.state === 'title' || world.state === 'win' || world.state === 'over') {
      // Menus stay alive: petals drift, flowers pulse.
      world.time += dt;
    }
    input.endFrame();
  }
  render(ctx, world);
  requestAnimationFrame(frame);
}
announce();
requestAnimationFrame(frame);

// Read-only hook for automated tests: state, score and a few setters that
// let a test drive the game to its end screens without playing for minutes.
window.__mothlight = {
  get state() { return world.state; },
  get score() { return world.score; },
  get lives() { return world.lives; },
  get wave() { return world.wave; },
  get carried() { return world.carried; },
  get bankedWave() { return world.bankedWave; },
  get bankedTotal() { return world.bankedTotal; },
  get charge() { return world.charge; },
  get wisps() { return world.wisps.length; },
  get pollen() { return world.pollen.length; },
  get bossHp() { return world.boss ? world.boss.hp : null; },
  get bossPhase() { return world.bossPhase; },
  start: () => { if (world.state === 'title') beginFromTitle(); },
  restart: () => { restart(); },
  setLives: (n) => { world.lives = n; },
  setWaveTime: (s) => { world.waveTimeLeft = s; },
  setBankedWave: (n) => { world.bankedWave = n; },
  setQuota: (n) => { world.quota = n; },
  teleport: (x, y) => { world.player.x = x; world.player.y = y; },
  bloom: () => ({ x: 480, y: 300 }),
};
