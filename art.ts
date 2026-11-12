// The pixel art: a palette, the pet drawn from shapes on a grid (so every pose and outfit stays on the same pixels),
// the clothes, the shop's icons and a 5x7 font. Everything here is pure and cached by key.

export type Rect = [x: number, y: number, w: number, h: number, color: string];
type Cells = (string | null)[][];

export const C = {
  ink: "#2a1b2e",
  body: "#ffd9a0", shade: "#f2a65e", belly: "#fff6e3", pink: "#ff8fab", white: "#ffffff",
  gold: "#ffd23f", goldDark: "#e09b1b", goldRim: "#c77d12", goldLight: "#fff3b0",
  red: "#ff4d6d", redDark: "#c9184a", redLight: "#ffb3c1",
  blue: "#3a86ff", blueDark: "#2a5cbf",
  sky: "#4cc9f0", skyDark: "#2fa3c7",
  cape: "#d62828", capeDark: "#9b1c1c",
  lens: "#3d3d6b", lensLight: "#b8c0ff",
  teal: "#2a9d8f", cream: "#e9f5db",
  steel: "#a5a5c8", wood: "#8a5a3c", bag: "#b5651d", bagDark: "#7a4012",
};

/** a pattern's characters → colours */
export const PATTERN_KEY: Record<string, string> = {
  k: C.ink, w: C.white, r: C.red, R: C.redDark, l: C.redLight,
  b: C.blue, B: C.blueDark, y: C.gold, Y: C.goldDark, o: C.goldRim, h: C.goldLight,
  t: C.sky, T: C.skyDark, c: C.cape, D: C.capeDark, S: C.lens, s: C.lensLight,
  g: C.teal, e: C.cream, m: C.steel, n: C.wood, a: C.bag, A: C.bagDark,
};

// ---- patterns (one string a row, "." is clear) ----
const RIBBON = ["r.....r", "lr...rr", "rrrRrrr", "rr...rr", "r.....r"];
const CAP = ["...bbbb......", ".bbbbbbbb....", "bbbbwwbbbb...", "bbbbbbbbbb...", "BBBBBBBBBBBBB"];
const CROWN = ["y...yy...y", "yy..yy..yy", "yyyybbyyyy", "yryyyyyyry", "YYYYYYYYYY"];
const SHADES = ["kkkkkkkkkkkk", "ksSSk..ksSSk", "kSSSk..kSSSk", ".kkk....kkk."];
export const COIN = ["..oooo..", ".oyyyyo.", "oyyhyyyo", "oyhyyYyo", "oyhyyYyo", "oyyyyYyo", ".oyYYyo.", "..oooo.."];
const TEE_ICON = ["tttt..tttt", "tttttttttt", "wwwwwwwwww", ".tttttttt.", "..wwwwww..", "..tttttt..", "..wwwwww..", "..tttttt.."];
const CAPE_ICON = ["..cccccc..", "..ccyycc..", ".cccccccc.", ".ccDDDDcc.", ".cDDDDDDc.", "ccDDDDDDcc", "ccDDDDDDcc", "cDDDDDDDDc", "cDDDDDDDDc", "cccccccccc"];
const SCARF_ICON = ["ggeeggeegg", "ggeeggeegg", "......gg..", "......ee..", "......gg..", "......ee..", ".....gggg.", ".....e..e."];
const PICK_ICON = ["..mmmmmm..", ".mm....mm.", "m...nn...m", "....nn....", "....nn....", "....nn....", "....nn....", "....nn....", "....nn....", "....nn...."];
const BAG_ICON = ["...AAAA...", "..A....A..", ".aaaaaaaa.", "aaaaaaaaaa", "aaaayyaaaa", "aaayyyyaaa", "aaaayyaaaa", "aaaaaaaaaa", "aaaaaaaaaa", ".aaaaaaaa."];
const ARROW = ["k.......", "kk......", "kwk.....", "kwwk....", "kwwwk...", "kwwwwk..", "kwwwwwk.", "kwwwwwwk", "kwwwkkkk", "kwkwk...", "kk.kwk..", "k...kwk.", "....kk.."];
const GLOVE_ICON = ["..rrrr....", ".rllrrr...", "rllrrrrr..", "rlrrrrrrr.", "rrrrrrrrrr", "rrrrrrr.rr", "rrrrrrr...", ".rrrrrr...", ".wwwwww...", ".wwwwww..."];
const HOUSE_ICON = ["....rr....", "...rrrr...", "..rrrrrr..", ".rrrrrrrr.", "rrrrrrrrrr", ".eeeeeeee.", ".essennee.", ".essennee.", ".eeeennee.", ".eeeennee."];
const DISK_ICON = ["bbbbbbb.", "bwwwwwbb", "bwwwwwbb", "bbbbbbbb", "bbmmmmbb", "bbmmkmbb", "bbmmmmbb", "bbbbbbbb"];
const CHECK = [".........w", "........ww", ".......ww.", "w.....ww..", "ww...ww...", ".ww.ww....", "..www.....", "...w......"];
const GEAR = ["....mm....", ".m.mmmm.m.", "..mmmmmm..", ".mmm..mmm.", "mmm....mmm", "mmm....mmm", ".mmm..mmm.", "..mmmmmm..", ".m.mmmm.m.", "....mm...."];
const SOUND = ["....m.....", "...mm...w.", "mmmmm.w..w", "mmmmm..w.w", "mmmmm..w.w", "mmmmm.w..w", "...mm...w.", "....m....."];
const MUTE = ["....m.....", "...mm.....", "mmmmm.r..r", "mmmmm..rr.", "mmmmm..rr.", "mmmmm.r..r", "...mm.....", "....m....."];
const NOTE = ["....mmmmm", "....mmmmm", "....m...m", "....m...m", "....m...m", ".mmmm.mmmm", "mmmmmmmmmm", "mmmm.mmmm.", ".mm...mm.."];
const NOTE_OFF = ["....mmmmm", "....mmmmm", "....m...m", "r...m...r", ".r..m..r.", ".mrmm.rmm", "mmmrmrmmmm", "mmmmrmmmm.", ".mmr.rmm..", "..r...r..."];
const DOWN = ["..yyyy..", "..yyyy..", "..yyyy..", "yyyyyyyy", ".yyyyyy.", "..yyyy..", "...yy..."];

// the pets' tools, the sun and the bin
const TOOL_ICONS: Record<string, string[]> = {
  "tool-cat-sec": ["......rrl.", ".....rrrl.", "......rr..", ".....n....", "....n.....", "...n......", "..n.......", ".n........", "n........."],
  "tool-cat-tap": ["..ll..ll..", "..ll..ll..", "ll......ll", "ll..ll..ll", "...llll...", "..llllll..", "..llllll..", "...llll..."],
  "tool-upa-sec": ["......tt..", ".....t..t.", ".....t.wt.", "......tt..", "..ttt.....", ".t...t....", ".t.w.t....", ".t...t....", "..ttt....."],
  "tool-upa-tap": ["l........l", "ll......ll", "lrl....lrl", "lrrl..lrrl", ".lrrllrrl.", "..lrrrrl..", "...lrrl...", "....ll...."],
  "tool-mungge-sec": ["...ww.....", "..wwww.ww.", ".wwwwwwwww", "wwwwwwwwww", "wwwwwwwwww", ".ssssssss."],
  "tool-mungge-tap": ["....y.....", "....y.....", "y..yyy..y.", ".yyyyyyy..", "..yyyyy...", ".yy...yy..", "y.......y."],
  "tool-mochi-sec": ["..nnnnnnnn..", ".nAAAAAAAAn.", ".nhyyhyyyhn.", "..yyhyyhyy..", ".yyyyyyyyyy.", "yhyyyhyyyyyh", "nnnnyyyynnnn", "YYYYyyyyYYYY", "nnnnnyynnnnn", "nAnnnnnnnnAn", "nnnnnnnnnnnn", "y.YYYYYYYY.y"],
  "tool-mochi-tap": ["g.........", "gg........", "ggg..g....", "gegg.gg...", "geegggeg..", "geeeggeeg.", ".geeeeeeeg", "..gggggggg"],
  // the speed tools: a bell, a water wheel, a pinwheel, a dragon's pearl
  "tool-cat-speed": ["....rr....", "...rllr...", "...yyyy...", ".yyhhyyyy.", "yyhhyyyyyy", "yhhyyyyyyy", "YYYYYYYYYY", "yyyykkyyyy", "yyykkkkyyy", ".yyyyyyyy.", "..YYYYYY.."],
  "tool-upa-speed": ["...nnnn...", ".nn.nn.nn.", ".n..nn..n.", "n...nn...n", "nnnnnnnnnn", "n...nn...n", ".n..nn..n.", ".nn.nn.nn.", "..tnnnnt..", "tttttttttt"],
  "tool-mungge-speed": ["rr.....tt", "rrr...ttt", ".rrr.ttt.", "..rrwtt..", "...www...", "..yywgg..", ".yyy.ggg.", "yyy...ggg", "yy.....gg", "....n....", "....n....", "....n...."],
  "tool-mochi-speed": ["...yyyy...", "..yhhhhy..", ".yhwwwwhy.", "yhwwwwsshy", "yhwwwssshy", "yhwwsssshy", "yhwssssshy", ".yhsssshy.", "..yhhhhy..", "...yyyy..."],
  sun: ["....y.....", ".y.....y..", "...yyy....", "..yhyyy...", "y.yhyyy.y.", "..yyyyy...", "...yyy....", ".y.....y..", "....y....."],
  trash: ["...kkkk...", ".kkkkkkkk.", "..mmmmmm..", "..mkmmkm..", "..mkmmkm..", "..mkmmkm..", "..mmmmmm.."],
};

export const ICONS: Record<string, string[]> = {
  ribbon: RIBBON, cap: CAP, crown: CROWN, shades: SHADES, tee: TEE_ICON, cape: CAPE_ICON, scarf: SCARF_ICON,
  pickaxe: PICK_ICON, gloves: GLOVE_ICON, house: HOUSE_ICON, disk: DISK_ICON, check: CHECK, gear: GEAR, sound: SOUND, mute: MUTE, note: NOTE, "note-off": NOTE_OFF, bag: BAG_ICON, coin: COIN, arrow: ARROW, down: DOWN,
  ...TOOL_ICONS,
};

/** the hats, as patterns a pet wears on its head (petArt.ts) */
export const HATS: Record<string, string[]> = { ribbon: RIBBON, cap: CAP, crown: CROWN };

// ---- grids → rects ----
function blank(w: number, h: number): Cells {
  return Array.from({ length: h }, () => Array<string | null>(w).fill(null));
}

/** each row's runs of one colour, as rects in cells */
function runs(cells: Cells): Rect[] {
  const out: Rect[] = [];
  for (let y = 0; y < cells.length; y++) {
    const row = cells[y];
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      if (!c) { x++; continue; }
      let e = x + 1;
      while (e < row.length && row[e] === c) e++;
      out.push([x, y, e - x, 1, c]);
      x = e;
    }
  }
  return out;
}

/** clear cells next to a filled one become the ink: the sprite's outline */
function outline(cells: Cells) {
  const h = cells.length, w = cells[0].length;
  const add: [number, number][] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (cells[y][x]) continue;
    const n = (yy: number, xx: number) => yy >= 0 && yy < h && xx >= 0 && xx < w && cells[yy][xx] && cells[yy][xx] !== C.ink;
    if (n(y - 1, x) || n(y + 1, x) || n(y, x - 1) || n(y, x + 1)) add.push([x, y]);
  }
  for (const [x, y] of add) cells[y][x] = C.ink;
}

function stamp(cells: Cells, pat: string[], ox: number, oy: number) {
  pat.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === ".") continue;
      const yy = oy + y, xx = ox + x;
      if (yy >= 0 && yy < cells.length && xx >= 0 && xx < cells[0].length) cells[yy][xx] = PATTERN_KEY[ch] ?? ch;
    }
  });
}

const iconCache = new Map<string, Rect[]>();
/** a pattern on its own, outlined: an icon. Cells are 1 unit, in a box the pattern's size plus a 1-cell rim. */
export function icon(name: string, rim = true): { rects: Rect[]; w: number; h: number } {
  const pat = ICONS[name];
  const w = Math.max(...pat.map((r) => r.length)) + (rim ? 2 : 0), h = pat.length + (rim ? 2 : 0);
  let rects = iconCache.get(name + rim);
  if (!rects) {
    const cells = blank(w, h);
    stamp(cells, pat, rim ? 1 : 0, rim ? 1 : 0);
    if (rim) outline(cells);
    rects = runs(cells);
    iconCache.set(name + rim, rects);
  }
  return { rects, w, h };
}

// ---- a 5x7 font ----
const G: Record<string, string> = {
  "0": ".###.#...##..###.#.###..##...#.###.",
  "1": "..#...##....#....#....#....#...###.",
  "2": ".###.#...#....#...#...#...#...#####",
  "3": "#####...#...#.....#.....##...#.###.",
  "4": "...#...##..#.#.#..#.#####...#....#.",
  "5": "######....####.....#....##...#.###.",
  "6": "..##..#...#....####.#...##...#.###.",
  "7": "#####....#...#...#...#....#....#...",
  "8": ".###.#...##...#.###.#...##...#.###.",
  "9": ".###.#...##...#.####....#...#..##..",
  A: ".###.#...##...#######...##...##...#",
  B: "####.#...##...#####.#...##...#####.",
  C: ".###.#...##....#....#....#...#.###.",
  D: "###..#..#.#...##...##...##..#.###..",
  E: "######....#....####.#....#....#####",
  F: "######....#....####.#....#....#....",
  G: ".###.#...##....#.####...##...#.####",
  H: "#...##...##...#######...##...##...#",
  I: ".###...#....#....#....#....#...###.",
  J: "..###...#....#....#....#.#..#..##..",
  K: "#...##..#.#.#..##...#.#..#..#.#...#",
  L: "#....#....#....#....#....#....#####",
  M: "#...###.###.#.##.#.##...##...##...#",
  N: "#...##...###..##.#.##..###...##...#",
  O: ".###.#...##...##...##...##...#.###.",
  P: "####.#...##...#####.#....#....#....",
  Q: ".###.#...##...##...##.#.##..#..##.#",
  R: "####.#...##...#####.#.#..#..#.#...#",
  S: ".#####....#.....###.....#....#####.",
  T: "#####..#....#....#....#....#....#..",
  U: "#...##...##...##...##...##...#.###.",
  V: "#...##...##...##...##...#.#.#...#..",
  W: "#...##...##...##.#.##.#.##.#.#.#.#.",
  X: "#...##...#.#.#...#...#.#.#...##...#",
  Y: "#...##...#.#.#...#....#....#....#..",
  Z: "#####....#...#...#...#...#....#####",
  " ": "...................................",
  "+": ".......#....#..#####..#....#.......",
  "-": "...............#####...............",
  ".": "..........................##...##..",
  "/": "....#....#...#...#...#...#....#....",
  ":": "......##...##........##...##.......",
  "!": "..#....#....#....#....#.........#..",
  "?": ".###.#...#....#...#...#.........#..",
  ">": ".#.....#.....#.....#...#...#...#...",
  "%": "##...##..#...#...#...#...#..##...##",
  ",": ".....................##....#...#...",
  "'": "..#....#...#.......................",
  "(": "...#...#...#....#....#.....#.....#.",
  ")": ".#.....#.....#....#....#...#...#...",
  "←": ".......#...#...#####.#.....#.......",
  "→": ".......#.....#.#####...#...#.......",
};

/** every character of `s` (upper-cased) is in the 5x7 font */
export const canDraw = (s: string) => [...s.toUpperCase()].every((ch) => ch in G);

const textCache = new Map<string, Rect[]>();
/** text in the 5x7 font, as rects in font cells (a glyph is 5 wide and 7 tall, 6 apart) */
export function text(str: string): Rect[] {
  const s = str.toUpperCase();
  let kept = textCache.get(s);
  if (kept) return kept;
  const w = s.length * 6, cells = blank(Math.max(1, w), 7);
  [...s].forEach((ch, i) => {
    const g = G[ch] ?? G["?"];
    for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) if (g[y * 5 + x] === "#") cells[y][i * 6 + x] = "#";
  });
  kept = runs(cells);
  textCache.set(s, kept);
  return kept;
}
export const textWidth = (str: string, px: number) => (str.length * 6 - 1) * px;

/** a rate: under a thousand, whole numbers whole and fractions with one decimal (1.5, 1.3); from a thousand, as fmt */
export const fmtRate = (n: number) => (n >= 1000 || Number.isInteger(n) ? fmt(n) : n.toFixed(1));

/** a number on screen, cut (never rounded up, so coins never look like more than they are): under a thousand whole;
 *  from a thousand `figures` figures (3; the HUD's coins 4) with K, M, B, T or Q (1.18K, 12.3K, 123K, 1.23M; 1.374T),
 *  trailing zeros dropped (1.2K, 3K) */
export function fmt(n: number, figures = 3): string {
  if (n < 1000) return String(Math.floor(n));
  const [unit, size] = n >= 1e15 ? ["Q", 1e15] : n >= 1e12 ? ["T", 1e12] : n >= 1e9 ? ["B", 1e9] : n >= 1e6 ? ["M", 1e6] : ["K", 1e3];
  const v = n / (size as number);
  const places = (v >= 100 ? 0 : v >= 10 ? 1 : 2) + figures - 3;
  // cut in whole steps of the last figure shown (10, 100 ... coins: exact), not v * 10^places, whose float error
  // needed a nudge that pushed a coin short of 1000T up to "1000T"
  const cut = Math.floor(n / (size / 10 ** places)) / 10 ** places;
  return `${String(cut.toFixed(places)).replace(/\.?0+$/, (m) => (m.startsWith(".") || places ? "" : m))}${unit}`;
}
