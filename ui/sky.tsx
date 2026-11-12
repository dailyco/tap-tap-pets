// The world behind the pet, through the day: the sky and the land as pictures by phase (ui/scenery.ts drawn into
// media/bg), the sun or the moon on its arc between them, the stars at night.
import { memo } from "react";
import { staticFile } from "raea";
import type { Rect } from "../art";
import { FH, FW } from "../layout";
import { Pixels, rect } from "./pixels";
import { skyAt, type Phase } from "./skyAt";

/** each path written out whole: export-game packs the files it finds named this way */
const BG: Record<Phase, { sky: string; land: string }> = {
  morning: { sky: staticFile("bg/morning-sky.png"), land: staticFile("bg/morning-land.png") },
  day: { sky: staticFile("bg/day-sky.png"), land: staticFile("bg/day-land.png") },
  sunset: { sky: staticFile("bg/sunset-sky.png"), land: staticFile("bg/sunset-land.png") },
  night: { sky: staticFile("bg/night-sky.png"), land: staticFile("bg/night-land.png") },
};

/** a picture the field's size, its pixels kept square and hard-edged however the field is scaled */
const Picture = ({ src }: { src: string }) => (
  <img src={src} style={{ position: "absolute", left: 0, top: 0, width: FW, height: FH, imageRendering: "pixelated" }} />
);

/** a round body of 8-unit cells around (0, 0) */
function disc(fill: (x: number, y: number, d: number) => string): Rect[] {
  const r: Rect[] = [];
  for (let y = -6; y < 6; y++) for (let x = -6; x < 6; x++) {
    const d = Math.hypot(x + 0.5, y + 0.5);
    if (d <= 5.6) r.push(rect(x * 8, y * 8, 8, 8, fill(x, y, d)));
  }
  return r;
}
const offset = (rs: Rect[], dx: number, dy: number): Rect[] => rs.map(([x, y, w, h, c]) => [x + dx, y + dy, w, h, c]);
/** the sun and the moon as sprites: their middle at (BODY, BODY), every cell at 0 or more */
const BODY = 80;
const MOON = offset(disc((x, y, d) => ((x === 1 && y === -2) || (x === -3 && y === 1) || (x === 2 && y === 2) || (x === 3 && y === 2) ? "#e8cf86" : d > 4.7 ? "#ffe9a8" : "#fff6d6")), BODY, BODY);
const SUN = offset([
  ...disc((x, y, d) => (d > 4.7 ? "#ffb347" : x < -1 && y < -1 ? "#fff3b0" : "#ffd23f")),
  ...[[-4, -76], [-4, 68], [-76, -4], [68, -4], [-56, -56], [48, -56], [-56, 48], [48, 48]].map(([x, y]) => rect(x, y, 8, 8, "#ffd23f")),
], BODY, BODY);

const STARS = Array.from({ length: 26 }, (_, i) => {
  const h = (n: number) => ((Math.sin(i * 127.1 + n * 311.7) * 43758.5453) % 1 + 1) % 1;
  return { x: Math.round((40 + h(1) * 1520) / 4) * 4, y: Math.round((20 + h(2) * 380) / 4) * 4, big: h(3) > 0.7, phase: Math.floor(h(4) * 150) };
});

/** the stars out at `frame`, each hidden, bright or dim: the same twinkle, the same rects (so nothing is redrawn) */
const starCache = new Map<string, Rect[]>();
function starRects(frame: number, n: number): Rect[] {
  const states = STARS.slice(0, n).map((s) => {
    const t = (frame + s.phase) % 150;
    return t < 8 ? 0 : t < 20 ? 1 : 2;
  });
  const key = states.join("");
  let r = starCache.get(key);
  if (r) return r;
  r = [];
  states.forEach((st, i) => {
    if (!st) return;
    const s = STARS[i], c = st === 1 ? "#ffffff" : "#c9b8ff";
    r!.push(rect(s.x, s.y, 4, 4, c));
    if (s.big || st === 1) r!.push(rect(s.x - 4, s.y, 4, 4, c), rect(s.x + 4, s.y, 4, 4, c), rect(s.x, s.y - 4, 4, 4, c), rect(s.x, s.y + 4, 4, 4, c));
  });
  if (starCache.size > 512) starCache.clear();
  starCache.set(key, r);
  return r;
}

export function Scene({ frame, sunFrames }: { frame: number; sunFrames: number }) {
  const sky = skyAt(sunFrames);
  const body = sky.sun ?? sky.moon;
  // twinkling on fours: the frames between are the same picture (see Pops)
  return <SceneView phase={sky.phase} stars={sky.stars ? starRects(frame - (frame % 4), sky.stars) : NO_STARS} moon={!sky.sun} x={body?.x ?? -1} y={body?.y ?? -1} />;
}

const NO_STARS: Rect[] = [];

/** the world as it looks: drawn again only when the phase, the stars or the sun's or moon's spot change */
const SceneView = memo(function SceneView({ phase, stars, moon, x, y }: { phase: Phase; stars: Rect[]; moon: boolean; x: number; y: number }) {
  // the sky, then what's in it, then the land in front (the sun sets behind the hills)
  return (
    <>
      <Picture src={BG[phase].sky} />
      {stars.length ? <Pixels rects={stars} px={1} x={0} y={0} w={FW} h={FH} /> : null}
      {x >= 0 ? <Pixels rects={moon ? MOON : SUN} px={1} x={x - BODY} y={y - BODY} /> : null}
      <Picture src={BG[phase].land} />
    </>
  );
});
