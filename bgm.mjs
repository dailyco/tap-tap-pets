// node bgm.mjs: the music (media/bgm/loop.wav), made here like the sounds (sfx.mjs): a bright chiptune loop, 8 bars of
// 120 bpm (16 s, BGM_FRAMES in music.ts), a square-wave tune over a triangle bass and soft hats. It ends where it
// starts, so it loops without a seam.
import { mkdirSync, writeFileSync } from "node:fs";

const RATE = 22050, BPM = 120, EIGHTH = 60 / BPM / 2, BARS = 8;
const LEN = Math.round(BARS * 8 * EIGHTH * RATE);
const out = new Float32Array(LEN);
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

/** a note added at `at` seconds for `dur` seconds: its wave, how loud, a soft attack and release so nothing clicks */
function note(at, dur, midi, wave, vol) {
  const start = Math.round(at * RATE), len = Math.round(dur * RATE), f = hz(midi);
  let phase = 0;
  for (let i = 0; i < len && start + i < LEN; i++) {
    phase += f / RATE;
    const p = phase % 1;
    const v = wave === "square" ? (p < 0.25 ? 1 : -1) : 1 - 4 * Math.abs(p - 0.5);
    const attack = Math.min(1, i / (0.005 * RATE));
    const body = 0.65 + 0.35 * Math.exp(-i / (0.08 * RATE));
    const release = Math.min(1, (len - i) / (0.03 * RATE));
    out[start + i] += v * vol * attack * body * release;
  }
}

/** a soft hat: a short burst of the same noise every time */
let seed = 12345;
const noise = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x3fffffff) - 1;
function hat(at) {
  const start = Math.round(at * RATE), len = Math.round(0.03 * RATE);
  for (let i = 0; i < len && start + i < LEN; i++) out[start + i] += noise() * 0.035 * (1 - i / len);
}

// the tune: eight eighths a bar (0: rest), over C, Am, F, G, twice, the second time higher
const TUNE = [
  [76, 79, 84, 79, 76, 79, 81, 79],
  [76, 72, 76, 81, 79, 76, 72, 74],
  [77, 81, 84, 81, 77, 81, 79, 77],
  [74, 79, 83, 79, 74, 77, 79, 0],
  [84, 83, 81, 79, 76, 79, 84, 86],
  [88, 84, 81, 76, 81, 84, 83, 81],
  [77, 81, 84, 89, 88, 84, 81, 77],
  [79, 83, 86, 83, 79, 74, 71, 74],
];
// the bass: root and fifth on each beat
const ROOTS = [48, 45, 41, 43, 48, 45, 41, 43];

TUNE.forEach((bar, b) => {
  bar.forEach((m, i) => {
    const at = (b * 8 + i) * EIGHTH;
    if (m) note(at, EIGHTH * 0.9, m, "square", 0.085);
    if (i % 2 === 1) hat(at);
  });
  for (let beat = 0; beat < 4; beat++) note((b * 8 + beat * 2) * EIGHTH, EIGHTH * 1.8, ROOTS[b] + (beat % 2 ? 7 : 0), "triangle", 0.22);
});

const data = Buffer.alloc(LEN * 2);
out.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2));
const head = Buffer.alloc(44);
head.write("RIFF", 0); head.writeUInt32LE(36 + data.length, 4); head.write("WAVE", 8);
head.write("fmt ", 12); head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(1, 22);
head.writeUInt32LE(RATE, 24); head.writeUInt32LE(RATE * 2, 28); head.writeUInt16LE(2, 32); head.writeUInt16LE(16, 34);
head.write("data", 36); head.writeUInt32LE(data.length, 40);
mkdirSync(new URL("media/bgm/", import.meta.url), { recursive: true });
writeFileSync(new URL("media/bgm/loop.wav", import.meta.url), Buffer.concat([head, data]));
console.log(`media/bgm/loop.wav: ${(LEN / RATE).toFixed(2)} s, peak ${out.reduce((m, v) => Math.max(m, Math.abs(v)), 0).toFixed(2)}`);
