// The still parts of the world, by phase of the day: the sky in six dithered bands (behind the sun and the moon), and
// the land in front of them (the hills coloured by the phase, then grass, flowers and dirt). Drawn once into pictures
// (media/bg, bun tools/scenery.ts): some 1,500 rects drawn every frame were a third of a frame's work.
import type { Rect } from "../art";
import { FH, FW, GROUND } from "../layout";
import { LOOK, type Phase } from "./skyAt";

export const PHASES: Phase[] = ["morning", "day", "sunset", "night"];

const BAND = GROUND / 6, CELL = 10;
const rect = (x: number, y: number, w: number, h: number, c: string): Rect => [x, y, w, h, c];

function bands(p: Phase): Rect[] {
  const b = LOOK[p].bands, r: Rect[] = [];
  b.forEach((c, i) => r.push(rect(0, Math.round(i * BAND), FW, Math.ceil(BAND) + 1, c)));
  for (let i = 1; i < b.length; i++) {
    const y = Math.round(i * BAND);
    for (let x = 0; x < FW; x += CELL * 2) r.push(rect(x, y - CELL, CELL, CELL, b[i]), rect(x + CELL, y, CELL, CELL, b[i - 1]));
  }
  return r;
}

function hills(p: Phase): Rect[] {
  const [far, near] = LOOK[p].hills, r: Rect[] = [];
  for (let x = 0; x < FW; x += 16) {
    const h = Math.round((170 + 45 * Math.sin(x / 160 + 1) + 22 * Math.sin(x / 47)) / 8) * 8;
    r.push(rect(x, GROUND - h, 16, h, far));
  }
  for (let x = 0; x < FW; x += 16) {
    const h = Math.round((92 + 34 * Math.sin(x / 115 + 3) + 14 * Math.sin(x / 33)) / 8) * 8;
    r.push(rect(x, GROUND - h, 16, h, near));
  }
  return r;
}

const GROUND_RECTS: Rect[] = (() => {
  const r: Rect[] = [];
  r.push(rect(0, GROUND, FW, 10, "#9be564"), rect(0, GROUND + 10, FW, 16, "#5cb85c"));
  for (let x = 24; x < FW; x += 72) {
    const h = 8 + ((x * 7) % 3) * 4;
    r.push(rect(x, GROUND - h, 8, h, "#5cb85c"), rect(x + 8, GROUND - h - 8, 8, h + 8, "#9be564"), rect(x + 16, GROUND - h, 8, h, "#5cb85c"));
  }
  for (const [x, c] of [[150, "#ff8fab"], [330, "#ffd23f"], [1180, "#4cc9f0"], [1480, "#ff8fab"], [470, "#ffffff"]] as const) {
    r.push(rect(x, GROUND - 24, 4, 24, "#3e8948"), rect(x - 8, GROUND - 36, 20, 12, c), rect(x - 4, GROUND - 40, 12, 4, c), rect(x - 4, GROUND - 24, 12, 4, c), rect(x, GROUND - 32, 4, 4, "#fff3b0"));
  }
  r.push(rect(0, GROUND + 26, FW, FH - GROUND - 26, "#4a2c17"));
  for (let row = 0, y = GROUND + 26; y < FH; row++, y += 30) {
    for (let x = (row % 2) * -40; x < FW; x += 80) r.push(rect(x + 4, y + 4, 72, 22, "#6b4226"), rect(x + 4, y + 4, 72, 4, "#7d5233"));
  }
  return r;
})();

/** the sky behind the sun and the moon */
export const skyRects = (p: Phase): Rect[] => bands(p);
/** the hills in front of them (the sun sets behind them), then the ground */
export const landRects = (p: Phase): Rect[] => [...hills(p), ...GROUND_RECTS];
