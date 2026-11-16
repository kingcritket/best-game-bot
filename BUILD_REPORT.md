# BUILD REPORT — Mothlight (best-game-01)

**Repo:** `~/workspace/makefun/best-game-bot/` — commit `b510f50` (di atas anchor
root `dff1da5`, drand round 33996974, init `makefun anchor
dff1da55c1330c9e3bf33715f176ef55e6ace353 round 33996974`, LICENSE MIT).
**Status:** dibangun + dites lokal. **BELUM di-submit** — submit oleh parent.
**Deadline entry:** 2026-11-18 18:00 UTC / 2026-11-19 01:00 WIB.

## Konsep game — Mothlight: Garden of the Last Lantern

Game arcade 2D canvas orisinal (bukan tiruan game komersial). Luma si ngengat
lentera mengumpulkan glowpollen yang melayang di taman malam, lalu
menyimpannya (bank) di Heart Bloom di tengah arena. Shadow wisp memburu
pemain: dash (Space/klik) menembus dan menghamburkan wisp, tapi butuh charge.
Setiap wave meminta kuota bank yang makin besar sebelum timer malam habis;
selesaikan 8 wave → taman mekar (layar menang). Kehabisan 3 nyawa → layar
kalah. Sistem: combo berantai (multiplier s.d. x5), charge dash, power-up
(Magnet / Moon Shield / Slow Night), 3 jenis wisp (chaser, splitter,
lunger), skor + best score (localStorage), musik generatif + SFX sintesis
WebAudio, menu title/pause/menang/kalah + restart, HUD lengkap (skor, kuota
wave, timer malam, nyawa, pollen dibawa, combo, bar dash).

## File yang dibuat (semua ditulis sendiri di sesi ini)

- `game/index.html` — halaman, satu canvas
- `game/src/main.js` — bootstrap, loop, state machine, hook tes `window.__mothlight`
- `game/src/world.js` — entitas, wave, skor, tabrakan, aturan menang/kalah
- `game/src/render.js` — semua gambar: taman, ngengat, wisp, HUD, semua layar
- `game/src/config.js` — konstanta tuning + palet
- `game/src/input.js` — keyboard + mouse
- `game/src/audio.js` — SFX + musik generatif via WebAudio (tanpa file audio)
- `game/src/random.js` — RNG seeded (mulberry32)
- `game/src/shots.js` — staged state untuk screenshot (`?shot=start|play|win|end&seed=`)
- `main.ts` — entrypoint Node 22 stdlib: salin game/ + screenshots/ ke /output,
  tulis dossier.json via `vendor/makefun-game.ts` (disalin utuh dari kit,
  sha256 `dc67187521b24025ff952f8c231485a6eb92d6d71d29edd2a08154ffb4376129`)
- `serve.ts` — server statis lokal (port 8080)
- `shots.json`, `README.md`, `.gitignore` (out/)
- `screenshots/` — 4 JPG asli render browser (lihat bawah)

Tidak ada library vendored, tidak ada aset eksternal, tidak ada request
jaringan. Semua art digambar via canvas, semua suara via WebAudio.

## Hasil tes

- **Tes logika headless** (`/tmp/moth-test.mjs`, Node, tanpa browser): 17/17
  PASS — start, kumpul pollen, bank di bloom, dash menghamburkan wisp +
  biaya charge, sentuhan wisp mengurangi nyawa, clear wave → wave 2,
  timeout malam mengurangi nyawa + kuota dipotong setengah, game over di
  0 nyawa, clear wave 8 → menang, soak 60 detik tanpa NaN/ledakan entitas.
- **Playtest browser nyata** (Playwright + Chromium headless 159, via
  `node serve.ts`): title → Enter → playing; steering keyboard mengumpulkan
  pollen (skor 0 → 5, carried 1); dash jalan (charge 61 → 49 = −12);
  pause/resume (P) jalan; game over paksa → R restart (skor reset 0).
  **0 console error, 0 failed request, 0 external request** (45 request,
  semua lokal: index.html + 8 modul JS × 5 load halaman).
- **Screenshot:** 4 file, masing-masing 960×600, 43–58 KiB (≤256 KiB),
  diambil Playwright dari render nyata game (`?shot=…&seed=1`, JPEG q88):
  `1-start.jpg` (title), `2-play.jpg` (gameplay + HUD), `3-win.jpg`
  (menang + statistik + restart), `4-end.jpg` (kalah + statistik + restart).
  Dicek visual: semua terbaca jelas.
- **`main.ts`:** `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` OK;
  `dossier.json` 335.218 byte (< 1,5 MiB), teks 59.331 byte (< 160 KiB),
  memuat ke-9 file sumber game. Dua run `main.ts` menghasilkan /output yang
  **byte-identik** (grader menjalankan 2× — deterministik).
- **Kit check** (`node cli/makefun.mjs check --kit . --repo …`): 5 passed —
  competition_open, snapshot (21 file, 327.711 byte), license_osi (MIT),
  entrypoint (main.ts → node22), repo_created_after_open. 1 failed yang
  **sudah diduga**: `transcripts_present` (transkrip baru ada saat parent
  menjalankan `bundle` + submit; bukan bagian tugas build ini).
- **Simulasi gate lokal:** game/ 9 file, 58.672 byte (batas 993 file /
  48 MiB); tidak ada referensi eksternal di game/ (grep http/https/fetch/
  import kosong); screenshot 4 file sesuai batas.

## Cara screenshot dibuat

Chromium tidak tersedia di VM, jadi diinstal via
`npx playwright install chromium` (unduhan ±126 MiB ke
`~/.cache/ms-playwright`, paket npm `playwright` di `/tmp/moth-tools`,
`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`). Skrip `/tmp/moth-tools/shots.mjs`:
serve `game/` dengan `serve.ts`, buka tiap `?shot=` dari `shots.json`,
screenshot JPEG 960×600, lalu playtest live. Semua screenshot adalah render
nyata kode game di browser — tidak diedit, tidak digambar ulang, tidak
diambil dari tempat lain.

## Blocker

Tidak ada blocker untuk build. Yang tersisa untuk parent saat submit:
bundle transkrip sesi ini (+ sesi parent bila ada), lalu
`submit --competition best-game-01 --source <repo> --commit b510f50 …
--keypair …` sebelum 2026-11-18 18:00 UTC. Perhatian: check kit mencatat
`repo_owner` — wallet anchor (GiTTB1S5cUUus2gbvhgp7JDWqDtDYE1Ccb2pJp31zZwv)
harus sudah tertaut ke akun @kingcritket saat submit.

## Catatan revisi

File direvisi ≥2 pesan sesuai transcript gate: `game/src/main.js`
(perbaikan: input pemicu start tidak ikut memicu dash),
`game/src/shots.js` (hapus import tak terpakai),
`game/src/render.js` (vignette memakai `WAVES.timePerWave`).
`BUILD_REPORT.md` ini sengaja TIDAK di-commit (laporan build, bukan isi entry).

---

# REVISI v2 — perbaikan menuju top 10 (2026-11-16, belum di-submit)

**Perintah parent:** "terus push sampai masuk top 10". Rank v1 saat itu
1049/3257 — entry terdekat ke atas, jadi perbaikan di sini paling bernilai.

## Yang berubah (commit `Mothlight v2`, di atas `b510f50`)

1. **Boss wave — Night Sovereign (`game/src/boss.js` baru):** wave 8 bukan
   lagi sekadar kuota. Sovereign muncul di awal wave 8: 6 HP, hanya dash
   yang bisa meretakkannya (1 HP per dash, sekali per dash, knockback +
   flash putih), kejar lambat + lunge ber-telegraph (roar) + memanggil
   chaser tiap 5 detik (maks 8 wisp). Begitu kuota wave 8 ter-bank, timer
   malam BERHENTI (`bossPhase`) dan kemenangan menuntut boss dihancurkan;
   kalau boss mati duluan, kuota tetap harus di-bank. Bar HP boss (6 pip)
   di HUD + teks "BREAK THE SOVEREIGN" menggantikan timer.
2. **Golden moon-pollen:** 6% pollen yang spawn berwarna emas, bernilai
   3 carried + skor 15 + charge 12 — alasan untuk mengejar, bukan sekadar
   lewat.
3. **Visual:** bulan rendah + siluet pinus di bukit (kedalaman latar),
   bunga lebih terang, ngengat ~15% lebih besar + aura lebih terang
   (pemain harus langsung ketemu mata), ring shockwave saat dash, vignette
   berdenyut merah di 10 detik terakhir wave.
4. **Audio:** `roar()` saat Sovereign bangun/telegraph, `tick()` tiap detik
   di 10 detik terakhir wave.
5. **Screenshot:** shot play di-stage ulang sebagai pertarungan boss
   (wave 8, quota 40/40, boss 3/6 HP, bar boss terlihat); shot win
   diperbarui (skor 5420, 31 wisp). Favicon `data:,` ditambahkan ke
   index.html — sebelumnya browser meminta /favicon.ico dan serve.ts
   menjawab 404 (2 console error di playtest v2 pertama).
6. **README:** menyebut boss + golden pollen; `main.js` hook `__mothlight`
   ditambah `bossHp` / `bossPhase`.

## Hasil tes v2

- **Tes logika headless** (`/tmp/moth-test-v2.mjs`, Node): **19/19 PASS** —
  9 regresi v1 (start, kumpul, bank, dash kill wisp, sentuhan wisp, clear
  wave, timeout, game over, soak) + 7 boss (spawn wave 8 HP 6, dash
  meretakkan sekali per dash, sentuhan boss mengurangi nyawa tanpa
  menghilangkan boss, quota → hunt phase + timer beku, boss mati di hunt
  phase → menang, boss mati sebelum kuota → belum menang lalu kuota →
  menang, boss memanggil chaser) + golden pollen (+3 carried, +15 skor) +
  determinisme seed + soak 60 detik tanpa NaN.
- **Playtest browser nyata** (Playwright + Chromium headless): title →
  Enter → playing; steering di sekitar bloom mengumpulkan pollen
  (skor 0 → 25, dash 55 → 49 charge); pause/resume jalan; timeout paksa
  → game over → R restart. **0 console error, 0 failed request,
  0 external request.**
- **Screenshot:** 4 file diregenerasi (960×600, JPEG q88, 45–65 KiB),
  dicek visual: boss + bar HP-nya terlihat di shot play, bulan + pinus
  terlihat di semua shot, semua teks terbaca.
- **`main.ts`:** dua run menghasilkan /output **byte-identik** (hash tree
  `3350b846…`); `dossier.json` 364.936 byte (< 1,5 MiB), teks 72.544 byte
  (< 160 KiB), 4 gambar.
- **Kit check:** 5 passed (competition_open, snapshot, license_osi,
  entrypoint, repo_created_after_open) — 1 failed yang sudah diduga:
  `transcripts_present` (transkrip baru ada saat parent bundle + submit).

## Penilaian jujur

v2 jelas lebih kuat dari v1: ada klimaks (boss), ada pilihan bermakna
(golden pollen), dan shot play menunjukkan kedalaman itu dalam sekejap —
tiga hal yang langsung dibaca juri pairwise. Tapi top 10 dari 1049/3257
tetap berat: butuh mengalahkan ~99,7% field di final heat (Swiss +
playoff), dan peringkat dev bukan peringkat final. Yang realistis:
lompatan berarti ke arah papan tengah-atas; top 10 tidak bisa dijanjikan.
Risiko utama yang tersisa: boss belum pernah dimainkan manusia sungguhan
(hanya headless + staged shot), jadi keseimbangan wave 8 (kuota 40 +
boss + wisp) belum teruji rasa mainnya.
