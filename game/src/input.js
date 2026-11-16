// Mothlight — keyboard and mouse input.
// WASD or arrow keys move, Space (or left click) dashes, P pauses,
// M mutes, Enter starts, R restarts. Edge-triggered actions (dash, pause)
// are consumed once per press so holding a key never double-fires.

const KEYMAP = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
};

export function createInput(canvas) {
  const input = {
    down: new Set(),
    pressed: new Set(),
    mouse: { x: 0, y: 0, inside: false },
    clicked: false,
    // Movement vector from the keys currently held, normalised.
    moveVector() {
      let x = 0;
      let y = 0;
      if (this.has('left')) x -= 1;
      if (this.has('right')) x += 1;
      if (this.has('up')) y -= 1;
      if (this.has('down')) y += 1;
      if (x !== 0 && y !== 0) {
        const inv = 1 / Math.hypot(x, y);
        x *= inv;
        y *= inv;
      }
      return { x, y };
    },
    has(action) {
      return KEYMAP[action].some((code) => this.down.has(code));
    },
    // True once per physical key press; callers consume it.
    wasPressed(code) {
      return this.pressed.has(code);
    },
    consume(code) {
      this.pressed.delete(code);
    },
    consumeDash() {
      const dash = this.wasPressed('Space') || this.clicked;
      this.consume('Space');
      this.clicked = false;
      return dash;
    },
    endFrame() {
      this.pressed.clear();
      this.clicked = false;
    },
  };

  window.addEventListener('keydown', (event) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
    }
    if (!event.repeat) input.pressed.add(event.code);
    input.down.add(event.code);
  });
  window.addEventListener('keyup', (event) => {
    input.down.delete(event.code);
  });
  window.addEventListener('blur', () => {
    input.down.clear();
  });
  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = ((event.clientX - rect.left) / rect.width) * 960;
    input.mouse.y = ((event.clientY - rect.top) / rect.height) * 600;
    input.mouse.inside = true;
  });
  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = ((event.clientX - rect.left) / rect.width) * 960;
    input.mouse.y = ((event.clientY - rect.top) / rect.height) * 600;
    input.clicked = true;
  });

  return input;
}
