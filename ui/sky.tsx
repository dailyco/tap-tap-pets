// The world behind the pet, through the day: the sky in six dithered bands and the hills coloured by the phase (built
// once per phase), the sun or the moon on its arc, the stars at night; grass, flowers and dirt never change.
import type { Rect } from "../art";
import { FH, FW, GROUND } from "../layout";
import { Pixels, rect } from "./pixels";
import { skyAt, type Phase } from "./skyAt";

const BAND = GROUND / 6, CELL = 10;

const bandCache = new Map<Phase, Rect[]>();
function bandRects(phase: Phase, bands: string[]): Rect[] {
  let r = bandCache.get(phase);
  if (r) return r;
  r = [];
  bands.forEach((c, i) => r!.push(rect(0, Math.round(i * BAND), FW, Math.ceil(BAND) + 1, c)));
  for (let i = 1; i < bands.length; i++) {
    const y = Math.round(i * BAND);
    for (let x = 0; x < FW; x += CELL * 2) r.push(rect(x, y - CELL, CELL, CELL, bands[i]), rect(x + CELL, y, CELL, CELL, bands[i - 1]));
  }
  bandCache.set(phase, r);
  return r;
}

const hillCache = new Map<Phase, Rect[]>();
function hillRects(phase: Phase, hills: [string, string]): Rect[] {
  let r = hillCache.get(phase);
  if (r) return r;
  r = [];
  for (let x = 0; x < FW; x += 16) {
    const far = Math.round((170 + 45 * Math.sin(x / 160 + 1) + 22 * Math.sin(x / 47)) / 8) * 8;
    r.push(rect(x, GROUND - far, 16, far, hills[0]));
  }
  for (let x = 0; x < FW; x += 16) {
    const near = Math.round((92 + 34 * Math.sin(x / 115 + 3) + 14 * Math.sin(x / 33)) / 8) * 8;
    r.push(rect(x, GROUND - near, 16, near, hills[1]));
  }
  hillCache.set(phase, r);
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

/** a round body of 8-unit cells around (0, 0) */
function disc(fill: (x: number, y: number, d: number) => string): Rect[] {
  const r: Rect[] = [];
  for (let y = -6; y < 6; y++) for (let x = -6; x < 6; x++) {
    const d = Math.hypot(x + 0.5, y + 0.5);
    if (d <= 5.6) r.push(rect(x * 8, y * 8, 8, 8, fill(x, y, d)));
  }
  return r;
}
const MOON = disc((x, y, d) => ((x === 1 && y === -2) || (x === -3 && y === 1) || (x === 2 && y === 2) || (x === 3 && y === 2) ? "#e8cf86" : d > 4.7 ? "#ffe9a8" : "#fff6d6"));
const SUN = [
  ...disc((x, y, d) => (d > 4.7 ? "#ffb347" : x < -1 && y < -1 ? "#fff3b0" : "#ffd23f")),
  ...[[-4, -76], [-4, 68], [-76, -4], [68, -4], [-56, -56], [48, -56], [-56, 48], [48, 48]].map(([x, y]) => rect(x, y, 8, 8, "#ffd23f")),
];
const offset = (rs: Rect[], dx: number, dy: number): Rect[] => rs.map(([x, y, w, h, c]) => [x + dx, y + dy, w, h, c]);

const STARS = Array.from({ length: 26 }, (_, i) => {
  const h = (n: number) => ((Math.sin(i * 127.1 + n * 311.7) * 43758.5453) % 1 + 1) % 1;
  return { x: Math.round((40 + h(1) * 1520) / 4) * 4, y: Math.round((20 + h(2) * 380) / 4) * 4, big: h(3) > 0.7, phase: Math.floor(h(4) * 150) };
});

export function Scene({ frame, sunFrames }: { frame: number; sunFrames: number }) {
  const sky = skyAt(sunFrames);
  const lights: Rect[] = [];
  STARS.slice(0, sky.stars).forEach((s) => {
    const t = (frame + s.phase) % 150;
    if (t < 8) return;
    const c = t < 20 ? "#ffffff" : "#c9b8ff";
    lights.push(rect(s.x, s.y, 4, 4, c));
    if (s.big || t < 20) lights.push(rect(s.x - 4, s.y, 4, 4, c), rect(s.x + 4, s.y, 4, 4, c), rect(s.x, s.y - 4, 4, 4, c), rect(s.x, s.y + 4, 4, 4, c));
  });
  const body = sky.sun ? offset(SUN, sky.sun.x, sky.sun.y) : sky.moon ? offset(MOON, sky.moon.x, sky.moon.y) : [];
  // the sky, then what's in it, then the hills in front (the sun sets behind them), then the ground
  return (
    <>
      <Pixels rects={bandRects(sky.phase, sky.bands)} px={1} x={0} y={0} w={FW} h={FH} />
      {lights.length || body.length ? <Pixels rects={[...lights, ...body]} px={1} x={0} y={0} w={FW} h={FH} /> : null}
      <Pixels rects={hillRects(sky.phase, sky.hills)} px={1} x={0} y={0} w={FW} h={FH} />
      <Pixels rects={GROUND_RECTS} px={1} x={0} y={0} w={FW} h={FH} />
    </>
  );
}
