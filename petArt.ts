// Draws a pet: its shapes rastered onto a grid with light and shade, coloured outlines, a face, a pose (breathing in,
// out, squashed by a tap) and the clothes it wears, each fitted to that pet's anchors. Pure, and cached by its inputs.
import { HATS, PATTERN_KEY, type Rect } from "./art";
import { PET_SPECS, type Part, type Ramp, type Shape, type Stamp } from "./petShapes";
import type { PetId, Wear } from "./state";

/** the canvas: the pets' 40x40 grid with 4 rows above it for hats */
export const PET_W = 40, PET_H = 44;
const OY = 4;
export type Pose = "mid" | "up" | "down" | "squash";
export type Eyes = "open" | "blink" | "happy";

const INK = "#2b1d3a";
const C = {
  sky: "#4cc9f0", skyDark: "#2fa3c7", white: "#ffffff", whiteDark: "#d8e6ee",
  gold: "#ffd23f", teal: "#2a9d8f", cream: "#e9f5db", lens: "#3d3d6b", lensLight: "#b8c0ff",
};
const CAPE: Ramp = ["#ff6b6b", "#d62828", "#9b1c1c", "#5a0f0f"];

/** how far the head moves in each pose; the body's width and height in each, its bottom kept on the ground */
const HEAD_DY: Record<Pose, number> = { mid: 0, up: -1, down: 1, squash: 2 };
const BODY_K: Record<Pose, [number, number]> = { mid: [1, 1], up: [0.97, 1.05], down: [1.03, 0.95], squash: [1.1, 0.86] };
const HEAD_PARTS: Part[] = ["head", "ear", "horn", "gill", "fluff"];

const moved = (s: Shape, dy: number): Shape => ("e" in s ? { ...s, e: [s.e[0], s.e[1] + dy, s.e[2], s.e[3]] } : { ...s, p: s.p.map(([x, y]) => [x, y + dy] as [number, number]) });
function posed(s: Shape, pose: Pose): Shape {
  const dy = HEAD_DY[pose];
  if (HEAD_PARTS.includes(s.part)) return moved(s, dy);
  if (s.part === "arm" || s.part === "wing") return moved(s, Math.sign(dy) * Math.ceil(Math.abs(dy) / 2));
  if ((s.part === "body" || s.part === "belly") && "e" in s) {
    const [cx, cy, rx, ry] = s.e, [kx, ky] = BODY_K[pose];
    return { ...s, e: [cx, cy + ry - ry * ky, rx * kx, ry * ky] };
  }
  return s;
}

function inPoly(x: number, y: number, pts: [number, number][]) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

interface Grid { col: (string | null)[][]; id: number[][]; tone: number[][]; part: (Part | null)[][] }

function raster(shapes: Shape[]): Grid {
  const g: Grid = {
    col: Array.from({ length: PET_H }, () => Array(PET_W).fill(null)),
    id: Array.from({ length: PET_H }, () => Array(PET_W).fill(-1)),
    tone: Array.from({ length: PET_H }, () => Array(PET_W).fill(-1)),
    part: Array.from({ length: PET_H }, () => Array(PET_W).fill(null)),
  };
  shapes.forEach((s, i) => {
    let bx = [0, 0, 1, 1];
    if ("p" in s) {
      const xs = s.p.map((q) => q[0]), ys = s.p.map((q) => q[1]);
      bx = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, (Math.max(...xs) - Math.min(...xs)) / 2, (Math.max(...ys) - Math.min(...ys)) / 2];
    }
    for (let y = 0; y < PET_H; y++) for (let x = 0; x < PET_W; x++) {
      const px = x + 0.5, py = y + 0.5 - OY;
      const [cx, cy, rx, ry] = "e" in s ? s.e : bx;
      const nx = (px - cx) / rx, ny = (py - cy) / ry;
      if (!("e" in s ? nx * nx + ny * ny <= 1 : inPoly(px, py, s.p))) continue;
      const lit = -nx * 0.6 - ny * 0.8, dark = nx * 0.45 + ny * 0.9;
      const tone = dark > 0.62 ? 2 : lit > 0.5 ? 0 : 1;
      g.id[y][x] = i; g.tone[y][x] = tone; g.col[y][x] = s.ramp[tone]; g.part[y][x] = s.part;
    }
  });
  const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  // a lined shape draws its edge where it lies over another
  const inner: [number, number, string][] = [];
  for (let y = 0; y < PET_H; y++) for (let x = 0; x < PET_W; x++) {
    const i = g.id[y][x];
    if (i < 0 || !shapes[i].line) continue;
    for (const [dx, dy] of shapes[i].line === "under" ? [[0, 1]] : nb) {
      const j = g.id[y + dy]?.[x + dx];
      if (j !== undefined && j >= 0 && j < i) { inner.push([x, y, shapes[i].ramp[3]]); break; }
    }
  }
  for (const [x, y, c] of inner) { g.col[y][x] = c; g.tone[y][x] = 3; }
  // the silhouette's outline, in the colour of what it borders
  const outer: [number, number, string][] = [];
  for (let y = 0; y < PET_H; y++) for (let x = 0; x < PET_W; x++) {
    if (g.id[y][x] >= 0) continue;
    for (const [dx, dy] of nb) {
      const j = g.id[y + dy]?.[x + dx];
      if (j !== undefined && j >= 0) { outer.push([x, y, shapes[j].ramp[3]]); break; }
    }
  }
  for (const [x, y, c] of outer) { g.col[y][x] = c; g.tone[y][x] = 3; }
  return g;
}

const stamp = (g: Grid, s: Stamp, dy: number) =>
  s.pat.forEach((row, ry) => [...row].forEach((ch, rx) => {
    const x = s.at[0] + rx, y = s.at[1] + ry + dy + OY;
    if (ch !== "." && g.col[y]?.[x] !== undefined) g.col[y][x] = s.key[ch];
  }));

const EYE: Record<Eyes, string[]> = {
  open: [".kk.", "kwwk", "kwki", "kkii", ".kk."],
  blink: ["....", "....", "....", "kkkk", "...."],
  happy: ["....", ".kk.", "k..k", "....", "...."],
};

function runs(col: (string | null)[][]): Rect[] {
  const out: Rect[] = [];
  col.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      if (!c) { x++; continue; }
      let e = x + 1;
      while (e < row.length && row[e] === c) e++;
      out.push([x, y, e - x, 1, c]);
      x = e;
    }
  });
  return out;
}

function build(pet: PetId, pose: Pose, eyes: Eyes, wear: Wear): Grid {
  const spec = PET_SPECS[pet];
  const { cx, hatY, neckY, bodyRx, feetY } = spec.anchors;
  const dy = HEAD_DY[pose];
  const shapes = spec.shapes.map((s) => posed(s, pose));
  if (wear.body === "cape") {
    const top = neckY + dy, w0 = bodyRx + 0.5, w1 = bodyRx + 4;
    shapes.unshift({ part: "cape", ramp: CAPE, line: true, p: [[cx - w0, top], [cx + w0, top], [cx + w1, feetY + 0.5], [cx - w1, feetY + 0.5]] });
  }
  const g = raster(shapes);
  // the face
  for (const [x, y] of spec.eyes) stamp(g, { at: [x, y], pat: EYE[eyes], key: { k: INK, w: "#ffffff", i: spec.iris } }, dy);
  stamp(g, spec.mouth, dy);
  for (const [x, y] of spec.cheeks.at) stamp(g, { at: [x, y], pat: ["cc"], key: { c: spec.cheeks.color } }, dy);
  for (const m of spec.marks) stamp(g, m, dy);

  const neck = neckY + dy + OY;
  const at = (x: number, y: number) => (y >= 0 && y < PET_H && x >= 0 && x < PET_W ? g.part[y][x] : null);
  const paint = (x: number, y: number, c: string) => { if (g.col[y]?.[x] !== undefined) g.col[y][x] = c; };
  // the body's clothes, over the body's own cells (lines kept)
  if (wear.body === "tee") {
    for (let y = neck; y < PET_H; y++) for (let x = 0; x < PET_W; x++) {
      const pt = at(x, y);
      if ((pt !== "body" && pt !== "belly") || g.tone[y][x] === 3) continue;
      const stripe = (y - neck) % 2 === 0, dark = g.tone[y][x] === 2;
      paint(x, y, stripe ? (dark ? C.whiteDark : C.white) : dark ? C.skyDark : C.sky);
    }
  }
  if (wear.body === "cape") {
    for (let x = 0; x < PET_W; x++) if ((at(x, neck) === "body" || at(x, neck) === "head") && g.tone[neck][x] !== 3) paint(x, neck, CAPE[1]);
    paint(cx, neck, C.gold); paint(cx + 1, neck, C.gold);
  }
  if (wear.acc === "scarf") {
    for (const y of [neck, neck + 1]) for (let x = 0; x < PET_W; x++) {
      const pt = at(x, y);
      if (pt && pt !== "tail" && pt !== "wing" && pt !== "gill" && pt !== "cape" && g.tone[y][x] !== 3) paint(x, y, Math.floor(x / 2) % 2 ? C.cream : C.teal);
    }
    for (let y = neck + 2; y <= neck + 4; y++) { const c = (y - neck) % 2 ? C.cream : C.teal; paint(cx + 2, y, c); paint(cx + 3, y, c); }
  }
  // shades over the eyes: a frame across the top, a lens on each eye
  const added: [number, number][] = [];
  if (wear.acc === "shades") {
    const [[lx, ey], [rx]] = spec.eyes;
    const y0 = ey + dy + OY;
    for (let x = lx - 1; x <= rx + 4; x++) paint(x, y0, INK);
    for (const ex of [lx, rx]) {
      for (let y = y0 + 1; y <= y0 + 3; y++) for (let x = ex; x < ex + 4; x++) paint(x, y, C.lens);
      paint(ex, y0 + 1, C.lensLight);
      for (let y = y0 + 1; y <= y0 + 2; y++) { paint(ex - 1, y, INK); paint(ex + 4, y, INK); }
      for (let x = ex; x < ex + 4; x++) paint(x, y0 + 4, INK);
    }
  }
  // the hat, sitting on the head
  if (wear.hat && HATS[wear.hat]) {
    const pat = HATS[wear.hat];
    const left = wear.hat === "ribbon" ? cx + 3 : cx - 5;
    const bottom = hatY + dy + OY + (wear.hat === "ribbon" ? 2 : 0);
    pat.forEach((row, ry) => [...row].forEach((ch, rx) => {
      const x = left + rx, y = bottom - (pat.length - 1) + ry;
      if (ch === "." || g.col[y]?.[x] === undefined) return;
      g.col[y][x] = PATTERN_KEY[ch];
      added.push([x, y]);
    }));
  }
  // what the hat adds past the pet gets an ink outline of its own
  const taken = new Set(added.map(([x, y]) => `${x},${y}`));
  for (const [x, y] of added) for (const [ddx, ddy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + ddx, ny = y + ddy;
    if (g.col[ny]?.[nx] === null && !taken.has(`${nx},${ny}`)) g.col[ny][nx] = INK;
  }
  return g;
}

const cache = new Map<string, Rect[]>();

/** the pet in a pose, with its eyes and what it wears, as rects on the PET_W x PET_H canvas */
export function petRects(pet: PetId, pose: Pose, eyes: Eyes, wear: Wear): Rect[] {
  const key = `${pet}|${pose}|${eyes}|${wear.hat}|${wear.body}|${wear.acc}`;
  let r = cache.get(key);
  if (!r) { r = runs(build(pet, pose, eyes, wear).col); cache.set(key, r); }
  return r;
}

/** the pet's shape in one dark colour, giving nothing else away */
export function silhouetteRects(pet: PetId): Rect[] {
  const key = `${pet}|silhouette`;
  let r = cache.get(key);
  if (!r) {
    const col = build(pet, "mid", "open", { hat: null, body: null, acc: null }).col.map((row) => row.map((c) => (c ? "#120a20" : null)));
    r = runs(col);
    cache.set(key, r);
  }
  return r;
}
