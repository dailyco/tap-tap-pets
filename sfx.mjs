// Writes the game's 8-bit sounds to media/sfx/*.wav: square and triangle blips, made here so they're the same every run.
// bun sfx.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const RATE = 44100;
const sq = (p) => (p % 1 < 0.5 ? 1 : -1);
const tri = (p) => 1 - 4 * Math.abs((p % 1) - 0.5);

/** notes: [{ hz, to?, s, wave, vol }] played one after another */
function make(notes) {
  const out = [];
  for (const n of notes) {
    const len = Math.round(n.s * RATE);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const hz = n.to ? n.hz + (n.to - n.hz) * t : n.hz;
      phase += hz / RATE;
      const env = Math.min(1, i / 60) * Math.pow(1 - t, n.decay ?? 1.2);
      out.push((n.wave === "tri" ? tri(phase) : sq(phase)) * env * (n.vol ?? 0.3));
    }
  }
  return out;
}

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => data.writeInt16LE(Math.max(-1, Math.min(1, v)) * 32767, i * 2));
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

const SOUNDS = {
  tap: [{ hz: 988, s: 0.04, vol: 0.22 }, { hz: 1319, s: 0.12, vol: 0.22, decay: 2 }],
  coin: [{ hz: 1568, s: 0.05, wave: "tri", vol: 0.35 }, { hz: 2093, s: 0.1, wave: "tri", vol: 0.3, decay: 2 }],
  buy: [523, 659, 784, 1047].map((hz, i) => ({ hz, s: i === 3 ? 0.22 : 0.06, vol: 0.2, decay: i === 3 ? 1.5 : 0.3 })),
  up: [392, 523, 659, 784, 1047, 1319].map((hz, i) => ({ hz, s: i === 5 ? 0.25 : 0.05, vol: 0.2, decay: i === 5 ? 1.5 : 0.3 })),
  fail: [{ hz: 196, to: 147, s: 0.09, vol: 0.22, decay: 0.2 }, { hz: 147, to: 110, s: 0.16, vol: 0.22 }],
  open: [{ hz: 660, s: 0.04, vol: 0.18, decay: 0.3 }, { hz: 990, s: 0.08, vol: 0.18 }],
  close: [{ hz: 990, s: 0.04, vol: 0.18, decay: 0.3 }, { hz: 660, s: 0.08, vol: 0.18 }],
  equip: [{ hz: 880, to: 1760, s: 0.1, wave: "tri", vol: 0.35 }],
  start: [392, 523, 659, 784].map((hz, i) => ({ hz, s: i === 3 ? 0.3 : 0.08, wave: "tri", vol: 0.4, decay: i === 3 ? 1.5 : 0.3 })),
  sure: [{ hz: 440, s: 0.07, vol: 0.18, decay: 0.3 }, { hz: 440, s: 0.12, vol: 0.18 }],
  save: [{ hz: 1047, s: 0.06, wave: "tri", vol: 0.4, decay: 0.3 }, { hz: 1568, s: 0.16, wave: "tri", vol: 0.4, decay: 1.5 }],
  sunrise: [523, 659, 784, 1047, 1319].map((hz, i) => ({ hz, s: i === 4 ? 0.45 : 0.09, wave: "tri", vol: 0.4, decay: i === 4 ? 1.2 : 0.4 })),
  reveal: [392, 523, 659, 784, 659, 784, 1047, 1319].map((hz, i) => ({ hz, s: i === 7 ? 0.6 : 0.09, vol: 0.2, decay: i === 7 ? 1.2 : 0.4 })),
  jackpot: [1047, 1319, 1568, 2093, 1568, 2093].map((hz, i) => ({ hz, s: 0.05, wave: "tri", vol: 0.4, decay: 0.3 })),
  delete: [{ hz: 330, to: 110, s: 0.3, vol: 0.22, decay: 0.8 }],
  fanfare: [523, 659, 784, 659, 784, 1047].map((hz, i) => ({ hz, s: i === 5 ? 0.5 : 0.11, vol: 0.2, decay: i === 5 ? 1.2 : 0.4 })),
};

mkdirSync("media/sfx", { recursive: true });
for (const [name, notes] of Object.entries(SOUNDS)) writeFileSync(`media/sfx/${name}.wav`, wav(make(notes)));
console.log("wrote", Object.keys(SOUNDS).map((n) => `media/sfx/${n}.wav`).join(" "));
