# Mothlight — Garden of the Last Lantern

An original 2D canvas arcade game for make.fun's **best-game-01** bounty.
Luma the lantern-moth gathers glowpollen in a dark garden, banks it at the
Heart Bloom, and dashes through the shadow wisps that hunt her. Clear all
8 waves before the night runs out — and on wave 8, break the Night
Sovereign, a six-hit boss that only a dash can crack — and the garden
blooms; lose all 3 lights and the light goes out. Rare golden moon-pollen
is worth three carried at once. Each wave adds a new danger — splitters,
bloom-guarding orbiters, lungers, fading stalkers, a thickening dark —
and every run is a gamble: banking 8+ pollen at once pays a Greed Bonus
and refills the dash, but a heavy moth flies slower. A rare Lantern Nova
scatters every wisp on screen.

## How to play

- **Move:** WASD or arrow keys (mouse click also dashes)
- **Dash:** Space or click — scatters wisps in your path, costs charge
- **Pause:** P · **Mute:** M · **Start / restart:** Enter or R
- Collect glowpollen to raise your combo, then bank it at the Heart Bloom
  (centre) to fill the wave quota. Power-ups: Magnet (M), Moon Shield (S),
  Slow Night (T), Lantern Nova (N, rare — scatters every wisp). Banking
  8+ pollen at once pays a Greed Bonus (+100, dash refilled) but carrying
  that much slows you down. Dash-kills, banking streaks and wave-clear
  bonuses all add score; your best score is kept in the browser.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, stdlib only) copies `game/` and `screenshots/` to the
output directory and writes `dossier.json` with the vendored make.fun
library. All art and sound are original: everything is drawn on canvas and
every sound is synthesised with WebAudio — no files are loaded over the
network and no libraries are vendored.

## Layout

- `game/index.html` — the page, one canvas
- `game/src/main.js` — bootstrap, loop, state machine, test hook
- `game/src/world.js` — entities, waves, scoring, collisions
- `game/src/waves.js` — what each wave adds: new threats, banners, speed
- `game/src/boss.js` — the Night Sovereign: boss AI, dash-hits, drawing
- `game/src/render.js` — all drawing: garden, moth, wisps, HUD, screens
- `game/src/config.js` — tuning constants and palette
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — WebAudio synth SFX and generative music
- `game/src/random.js` — seeded RNG
- `game/src/shots.js` — staged states for the entry screenshots
- `main.ts`, `serve.ts`, `vendor/makefun-game.ts`, `screenshots/`

## License

MIT — see `LICENSE`.
