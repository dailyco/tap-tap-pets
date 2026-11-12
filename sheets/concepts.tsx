// A throwaway sheet: three new pet concepts, drawn from shapes on a 40x40 grid with shading and coloured outlines.
// Not used by the game.
import { AbsoluteFill, Composition, registerRoot } from "raea";

type Ramp = [light: string, base: string, shade: string, line: string];
/** line: the shape draws its edge where it lies over another; "under" only along its bottom (a paw's crease) */
type Line = boolean | "under";
type Shape = { e: [number, number, number, number]; ramp: Ramp; line?: Line } | { p: [number, number][]; ramp: Ramp; line?: Line };
interface Stamp { at: [number, number]; pat: string[]; key: Record<string, string> }
const N = 40;

function inPoly(x: number, y: number, pts: [number, number][]) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function draw(shapes: Shape[], stamps: Stamp[]) {
  const id: number[][] = Array.from({ length: N }, () => Array(N).fill(-1));
  const col: (string | null)[][] = Array.from({ length: N }, () => Array(N).fill(null));
  shapes.forEach((s, i) => {
    let bx = [0, 0, 0, 0];
    if ("p" in s) {
      const xs = s.p.map((q) => q[0]), ys = s.p.map((q) => q[1]);
      bx = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, (Math.max(...xs) - Math.min(...xs)) / 2, (Math.max(...ys) - Math.min(...ys)) / 2];
    }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const px = x + 0.5, py = y + 0.5;
      const [cx, cy, rx, ry] = "e" in s ? s.e : bx;
      const nx = (px - cx) / rx, ny = (py - cy) / ry;
      const inside = "e" in s ? nx * nx + ny * ny <= 1 : inPoly(px, py, s.p);
      if (!inside) continue;
      const lit = -nx * 0.6 - ny * 0.8, dark = nx * 0.45 + ny * 0.9;
      id[y][x] = i;
      col[y][x] = dark > 0.62 ? s.ramp[2] : lit > 0.5 ? s.ramp[0] : s.ramp[1];
    }
  });
  const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  // a lined shape draws its edge where it lies over another shape
  const inner: [number, number, string][] = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = id[y][x];
    if (i < 0 || !shapes[i].line) continue;
    for (const [dx, dy] of shapes[i].line === "under" ? [[0, 1]] : nb) {
      const j = id[y + dy]?.[x + dx];
      if (j !== undefined && j >= 0 && j < i) { inner.push([x, y, shapes[i].ramp[3]]); break; }
    }
  }
  for (const [x, y, c] of inner) col[y][x] = c;
  // the silhouette's outline, in the colour of what it borders
  const outer: [number, number, string][] = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (id[y][x] >= 0) continue;
    for (const [dx, dy] of nb) {
      const j = id[y + dy]?.[x + dx];
      if (j !== undefined && j >= 0) { outer.push([x, y, shapes[j].ramp[3]]); break; }
    }
  }
  for (const [x, y, c] of outer) col[y][x] = c;
  for (const s of stamps) s.pat.forEach((row, dy) => [...row].forEach((ch, dx) => { if (ch !== ".") col[s.at[1] + dy][s.at[0] + dx] = s.key[ch]; }));
  return col;
}

function Sprite({ cells, px, x, y, mono }: { cells: (string | null)[][]; px: number; x: number; y: number; mono?: string }) {
  const by = new Map<string, string>();
  cells.forEach((row, yy) => {
    let xx = 0;
    while (xx < N) {
      const c = row[xx];
      if (!c) { xx++; continue; }
      let e = xx + 1;
      while (e < N && row[e] === c) e++;
      const k = mono ?? c;
      by.set(k, (by.get(k) ?? "") + `M${xx} ${yy}h${e - xx}v1h${xx - e}z`);
      xx = e;
    }
  });
  return (
    <svg width={N * px} height={N * px} viewBox={`0 0 ${N} ${N}`} shapeRendering="crispEdges" style={{ position: "absolute", left: x, top: y }}>
      {[...by].map(([c, d]) => <path key={c} d={d} fill={c} />)}
    </svg>
  );
}

// ---- faces, shared ----
const INK = "#2b1d3a";
const EYE = [".kk.", "kwwk", "kwki", "kkii", ".kk."];
const MOUTH = ["kpk", ".k."];
const face = (lx: number, rx: number, ey: number, mouth: [number, number], cheek: string, iris: string, cheeks: [number, number][]): Stamp[] => [
  { at: [lx, ey], pat: EYE, key: { k: INK, w: "#ffffff", i: iris } },
  { at: [rx, ey], pat: EYE, key: { k: INK, w: "#ffffff", i: iris } },
  { at: mouth, pat: MOUTH, key: { k: INK, p: "#ff6b8a" } },
  ...cheeks.map((at) => ({ at, pat: ["cc"], key: { c: cheek } })),
];

// ---- 1. Mochi dragon: a soft baby dragon, little wings, a heart at the tail's tip ----
const LAV: Ramp = ["#ffffff", "#efe6ff", "#cdb8f2", "#6b4fa0"];
const MINT: Ramp = ["#d8fff0", "#a8ecd2", "#6fcfaa", "#2f7a60"];
const CREAM: Ramp = ["#fffbe8", "#ffe9a8", "#e8c46a", "#8a6a2a"];
const HEART: Ramp = ["#ffd0dc", "#ff8fab", "#e0607e", "#8a2a44"];
const DRAGON = draw([
  { p: [[12, 22], [3, 14], [6, 20], [2, 23], [7, 25], [4, 28], [12, 28]], ramp: MINT, line: true },
  { e: [30.5, 31, 4.6, 2.6], ramp: LAV },
  { e: [34, 27.5, 2.2, 3], ramp: LAV },
  { e: [33.6, 22.6, 1.8, 1.8], ramp: HEART }, { e: [36.2, 22.6, 1.8, 1.8], ramp: HEART }, { p: [[31.8, 23.2], [38, 23.2], [34.9, 26.6]], ramp: HEART },
  { e: [20, 29.5, 7.6, 6.6], ramp: LAV },
  { e: [21, 30.8, 4.6, 4.4], ramp: ["#ffffff", "#fff6ea", "#f0dcc4", "#8a6a2a"] },
  { e: [16.5, 35.6, 2.7, 1.8], ramp: LAV }, { e: [24.2, 35.8, 2.7, 1.8], ramp: LAV },
  { p: [[11.5, 9], [15.5, 7.5], [11, 2.5]], ramp: CREAM }, { p: [[24.5, 7], [28.5, 8.5], [29.5, 2.5]], ramp: CREAM },
  { e: [20, 15, 11.6, 9.6], ramp: LAV, line: true },
  { e: [16.4, 27.4, 2.6, 2], ramp: LAV, line: "under" }, { e: [24, 27.4, 2.6, 2], ramp: LAV, line: "under" },
], face(14, 23, 13, [20, 19], "#ffa8c2", "#6b4fa0", [[12, 19], [28, 19]]));

// ---- 2. Upa: a smiling axolotl, feathery gills on both sides of its head ----
const PINK: Ramp = ["#fff4f8", "#ffcadd", "#f2a0c0", "#a04a74"];
const GILL: Ramp = ["#ffb8dc", "#f070aa", "#c94585", "#7a2350"];
const BELLY: Ramp = ["#ffffff", "#fff0f6", "#ffd6e6", "#a04a74"];
const AXO = draw([
  { e: [9.5, 31, 5.4, 2.6], ramp: PINK, line: true },
  { e: [5.8, 8.6, 3.6, 1.5], ramp: GILL, line: true }, { e: [4.2, 14, 3.8, 1.5], ramp: GILL, line: true }, { e: [6, 19.4, 3.4, 1.5], ramp: GILL, line: true },
  { e: [34.4, 8.6, 3.2, 1.5], ramp: GILL, line: true }, { e: [35.8, 14, 3.4, 1.5], ramp: GILL, line: true }, { e: [34.2, 19.4, 3, 1.5], ramp: GILL, line: true },
  { e: [20, 29.5, 7.2, 6.4], ramp: PINK },
  { e: [21, 30.6, 4.4, 4.4], ramp: BELLY },
  { e: [16.5, 35.6, 2.7, 1.8], ramp: PINK }, { e: [24.2, 35.8, 2.7, 1.8], ramp: PINK },
  { e: [20, 14.6, 12.8, 9], ramp: PINK, line: true },
  { e: [16.4, 27.4, 2.6, 2], ramp: PINK, line: "under" }, { e: [24, 27.4, 2.6, 2], ramp: PINK, line: "under" },
], [
  ...face(13, 24, 12, [0, 0], "#ff7aa6", "#7a2350", [[11, 18], [29, 18]]).filter((s) => s.pat !== MOUTH),
  { at: [17, 18], pat: ["k.....k", ".kpppk.", "..kkk.."], key: { k: INK, p: "#ff6b8a" } },
  { at: [12, 8], pat: ["g"], key: { g: "#f070aa" } }, { at: [27, 7], pat: ["gg"], key: { g: "#f070aa" } }, { at: [30, 11], pat: ["g"], key: { g: "#f070aa" } },
]);

// ---- 3. Mungge: a cloud lamb, a puffy woolly silhouette and little blue horns ----
const WOOL: Ramp = ["#ffffff", "#f3f6ff", "#cad6f0", "#6a78a8"];
const FACE: Ramp = ["#fff4e6", "#f6d8b8", "#dcae86", "#8a5a3c"];
const SKY: Ramp = ["#d8f2ff", "#86d0ff", "#4aa3db", "#2a5f8a"];
const LAMB = draw([
  { e: [10, 29, 3.2, 3.2], ramp: WOOL, line: true },
  { e: [16, 36, 2.3, 1.8], ramp: FACE }, { e: [24, 36.2, 2.3, 1.8], ramp: FACE },
  { e: [20, 29.6, 8.2, 6.4], ramp: WOOL }, { e: [14, 33, 2.8, 2.6], ramp: WOOL }, { e: [19.5, 34.4, 2.8, 2.6], ramp: WOOL }, { e: [25.5, 33.4, 2.8, 2.6], ramp: WOOL },
  { e: [20, 14, 10, 8], ramp: WOOL, line: true },
  { e: [12, 10, 4.6, 4.6], ramp: WOOL }, { e: [17, 6.4, 4.6, 4.6], ramp: WOOL }, { e: [23.5, 6.4, 4.6, 4.6], ramp: WOOL }, { e: [28.5, 10, 4.6, 4.6], ramp: WOOL },
  { e: [30.2, 16, 4, 4], ramp: WOOL }, { e: [9.8, 16, 4, 4], ramp: WOOL }, { e: [13, 21, 3.8, 3.4], ramp: WOOL }, { e: [27.5, 21, 3.8, 3.4], ramp: WOOL },
  { e: [21, 16.4, 7.2, 6.2], ramp: FACE, line: true },
  { e: [11.6, 13.6, 2.4, 2.4], ramp: SKY, line: true }, { e: [30.6, 13.6, 2.1, 2.1], ramp: SKY, line: true },
  { e: [16.4, 27.6, 2.4, 2], ramp: FACE, line: "under" }, { e: [24.2, 27.6, 2.4, 2], ramp: FACE, line: "under" },
], [
  ...face(16, 23, 13, [21, 19], "#ff9fb8", "#8a5a3c", [[15, 19], [27, 19]]),
  { at: [11, 13], pat: ["s"], key: { s: "#2a5f8a" } }, { at: [30, 13], pat: ["s"], key: { s: "#2a5f8a" } },
  { at: [19, 4], pat: [".s.", "sss", ".s."], key: { s: "#4aa3db" } },
]);

const PETS = [
  { name: "모찌룡", what: "말랑한 아기 용", point: "등의 작은 날개 · 꼬리 끝 하트", cells: DRAGON, swatch: [LAV[1], MINT[1], CREAM[1], HEART[1]] },
  { name: "우파", what: "늘 웃고 있는 우파루파", point: "머리 양옆 깃털 아가미 · 활짝 웃는 입", cells: AXO, swatch: [PINK[1], GILL[1], BELLY[1], "#ff7aa6"] },
  { name: "뭉게", what: "구름 털뭉치 아기 양", point: "몽글몽글 실루엣 · 파란 뿔과 별", cells: LAMB, swatch: [WOOL[1], FACE[1], SKY[1], "#ff9fb8"] },
];

const FONT = "Apple SD Gothic Neo";

function Sheet() {
  return (
    <AbsoluteFill style={{ backgroundColor: "#140c26" }}>
      <div style={{ position: "absolute", left: 0, top: 44, width: 1920, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 56, color: "#ffd23f" }}>새 펫 콘셉트 3가지</div>
      <div style={{ position: "absolute", left: 0, top: 118, width: 1920, textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: 28, color: "#b3a6e6" }}>
        큰 머리 · 과장된 특징 하나 · 3/4 각도 · 절제된 색 · 반짝이는 눈 · 앞발 모은 포즈
      </div>
      {PETS.map((p, i) => {
        const x = 70 + i * 610;
        return (
          <div key={p.name}>
            <div style={{ position: "absolute", left: x, top: 190, width: 560, height: 840, borderRadius: 28, background: "linear-gradient(#2f1d5c, #5a2e7e)" }} />
            <div style={{ position: "absolute", left: x + 130, top: 640, width: 300, height: 26, borderRadius: 13, backgroundColor: "#00000040" }} />
            <Sprite cells={p.cells} px={11} x={x + 60} y={220} />
            <Sprite cells={p.cells} px={3} x={x + 440} y={214} mono="#120a20" />
            <div style={{ position: "absolute", left: x + 440, top: 336, width: 120, textAlign: "center", fontFamily: FONT, fontSize: 18, color: "#8c7fbf" }}>실루엣</div>
            <div style={{ position: "absolute", left: x, top: 700, width: 560, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 64, color: "#ffffff" }}>{p.name}</div>
            <div style={{ position: "absolute", left: x, top: 790, width: 560, textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: 32, color: "#e2ddf0" }}>{p.what}</div>
            <div style={{ position: "absolute", left: x, top: 846, width: 560, textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: 26, color: "#ffd23f" }}>{p.point}</div>
            {p.swatch.map((c, j) => (
              <div key={c} style={{ position: "absolute", left: x + 196 + j * 44, top: 930, width: 34, height: 34, borderRadius: 8, backgroundColor: c, border: "3px solid #120a20" }} />
            ))}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

registerRoot(() => <Composition id="concepts" component={Sheet} width={1920} height={1080} fps={30} durationInFrames={1} />);
