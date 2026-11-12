// The four pets, as shapes on a 40x40 grid (drawn back to front), their faces and where their clothes go. Cute by the
// same rules for all four: a big head, one exaggerated feature, a 3/4 turn, few colours, shining eyes, paws held together.
import type { PetId } from "./state";

export type Part = "head" | "body" | "belly" | "foot" | "arm" | "tail" | "wing" | "ear" | "horn" | "gill" | "fluff" | "cape";
export type Ramp = [light: string, base: string, shade: string, line: string];
/** line: the shape draws its edge where it lies over another; "under" only along its bottom (a paw's crease) */
export type Shape = ({ e: [cx: number, cy: number, rx: number, ry: number] } | { p: [number, number][] }) & { part: Part; ramp: Ramp; line?: boolean | "under" };
export interface Stamp { at: [number, number]; pat: string[]; key: Record<string, string> }
export interface PetSpec {
  shapes: Shape[];
  /** the top-left of each 4x5 eye */
  eyes: [[number, number], [number, number]];
  iris: string;
  mouth: Stamp;
  cheeks: { at: [number, number][]; color: string };
  /** marks on the head (stripes, spots, a star) */
  marks: Stamp[];
  /** cx: the middle; hatY: the row a hat sits on; neckY: where clothes start; bodyRx, feetY: the cape's size */
  anchors: { cx: number; hatY: number; neckY: number; bodyRx: number; feetY: number };
}

const INK = "#2b1d3a";
const SMILE: Stamp = { at: [20, 19], pat: ["kpk", ".k."], key: { k: INK, p: "#ff6b8a" } };
const at = (x: number, y: number): [number, number] => [x, y];
const paws = (ramp: Ramp): Shape[] => [
  { part: "arm", e: [16.4, 27.4, 2.6, 2], ramp, line: "under" },
  { part: "arm", e: [24, 27.4, 2.6, 2], ramp, line: "under" },
];
const feet = (ramp: Ramp): Shape[] => [
  { part: "foot", e: [16.5, 35.6, 2.7, 1.8], ramp },
  { part: "foot", e: [24.2, 35.8, 2.7, 1.8], ramp },
];

// ---- the cat: big ears, a striped brow, a tail curled like a question mark ----
const ORANGE: Ramp = ["#ffe2b8", "#ffc078", "#e8904a", "#8a4a22"];
const CREAM_C: Ramp = ["#ffffff", "#fff3e0", "#f2d6b3", "#8a4a22"];
const EAR_PINK: Ramp = ["#ffd6e0", "#ff9fb8", "#e07a98", "#8a2a44"];
const CAT: PetSpec = {
  shapes: [
    { part: "tail", e: [29.5, 31.5, 4.2, 2.3], ramp: ORANGE, line: true },
    { part: "tail", e: [33.4, 28.2, 2.3, 3.2], ramp: ORANGE, line: true },
    { part: "tail", e: [32.6, 23.6, 2.5, 2.8], ramp: ORANGE, line: true },
    { part: "tail", e: [31, 21, 2.4, 2.1], ramp: CREAM_C, line: true },
    { part: "ear", p: [[9, 11], [16, 7.5], [8.5, 1.5]], ramp: ORANGE, line: true },
    { part: "ear", p: [[24, 7.5], [31, 10.5], [31.5, 1.5]], ramp: ORANGE, line: true },
    { part: "ear", p: [[10.3, 9.3], [14.2, 7.9], [10.1, 4.2]], ramp: EAR_PINK },
    { part: "ear", p: [[25.8, 7.9], [29.7, 9.3], [29.9, 4.2]], ramp: EAR_PINK },
    { part: "body", e: [20, 29.5, 7.4, 6.4], ramp: ORANGE },
    { part: "belly", e: [21, 30.8, 4.4, 4.2], ramp: CREAM_C },
    ...feet(CREAM_C),
    { part: "head", e: [20, 15.5, 11.8, 9.4], ramp: ORANGE, line: true },
    { part: "head", e: [21, 19.6, 4.4, 2.8], ramp: CREAM_C },
    ...paws(CREAM_C),
  ],
  eyes: [at(14, 13), at(23, 13)],
  iris: "#3f8f74",
  mouth: { at: [19, 18], pat: [".ppp.", "..k..", "kk.kk"], key: { k: INK, p: "#ff8fab" } },
  cheeks: { at: [at(11, 19), at(28, 19)], color: "#ff9fb8" },
  marks: [
    { at: [18, 7], pat: ["s", "s"], key: { s: "#d9783a" } },
    { at: [20, 6], pat: ["s", "s", "s"], key: { s: "#d9783a" } },
    { at: [22, 7], pat: ["s", "s"], key: { s: "#d9783a" } },
  ],
  anchors: { cx: 20, hatY: 6, neckY: 24, bodyRx: 7.4, feetY: 37 },
};

// ---- Mochiryu: a soft baby dragon, little wings, a heart at the tail's tip ----
const LAV: Ramp = ["#ffffff", "#efe6ff", "#cdb8f2", "#6b4fa0"];
const MINT: Ramp = ["#d8fff0", "#a8ecd2", "#6fcfaa", "#2f7a60"];
const CREAM: Ramp = ["#fffbe8", "#ffe9a8", "#e8c46a", "#8a6a2a"];
const HEART: Ramp = ["#ffd0dc", "#ff8fab", "#e0607e", "#8a2a44"];
const MOCHI: PetSpec = {
  shapes: [
    { part: "wing", p: [[12, 22], [3, 14], [6, 20], [2, 23], [7, 25], [4, 28], [12, 28]], ramp: MINT, line: true },
    { part: "tail", e: [30.5, 31, 4.6, 2.6], ramp: LAV },
    { part: "tail", e: [34, 27.5, 2.2, 3], ramp: LAV },
    { part: "tail", e: [33.6, 22.6, 1.8, 1.8], ramp: HEART },
    { part: "tail", e: [36.2, 22.6, 1.8, 1.8], ramp: HEART },
    { part: "tail", p: [[31.8, 23.2], [38, 23.2], [34.9, 26.6]], ramp: HEART },
    { part: "body", e: [20, 29.5, 7.6, 6.6], ramp: LAV },
    { part: "belly", e: [21, 30.8, 4.6, 4.4], ramp: ["#ffffff", "#fff6ea", "#f0dcc4", "#8a6a2a"] },
    ...feet(LAV),
    { part: "horn", p: [[11.5, 9], [15.5, 7.5], [11, 2.5]], ramp: CREAM },
    { part: "horn", p: [[24.5, 7], [28.5, 8.5], [29.5, 2.5]], ramp: CREAM },
    { part: "head", e: [20, 15, 11.6, 9.6], ramp: LAV, line: true },
    ...paws(LAV),
  ],
  eyes: [at(14, 13), at(23, 13)],
  iris: "#6b4fa0",
  mouth: SMILE,
  cheeks: { at: [at(12, 19), at(28, 19)], color: "#ffa8c2" },
  marks: [],
  anchors: { cx: 20, hatY: 5, neckY: 24, bodyRx: 7.6, feetY: 37 },
};

// ---- Upa: a smiling axolotl, feathery gills on both sides of its head ----
const PINK: Ramp = ["#fff4f8", "#ffcadd", "#f2a0c0", "#a04a74"];
const GILL: Ramp = ["#ffb8dc", "#f070aa", "#c94585", "#7a2350"];
const BELLY: Ramp = ["#ffffff", "#fff0f6", "#ffd6e6", "#a04a74"];
const UPA: PetSpec = {
  shapes: [
    { part: "tail", e: [9.5, 31, 5.4, 2.6], ramp: PINK, line: true },
    { part: "gill", e: [5.8, 8.6, 3.6, 1.5], ramp: GILL, line: true },
    { part: "gill", e: [4.2, 14, 3.8, 1.5], ramp: GILL, line: true },
    { part: "gill", e: [6, 19.4, 3.4, 1.5], ramp: GILL, line: true },
    { part: "gill", e: [34.4, 8.6, 3.2, 1.5], ramp: GILL, line: true },
    { part: "gill", e: [35.8, 14, 3.4, 1.5], ramp: GILL, line: true },
    { part: "gill", e: [34.2, 19.4, 3, 1.5], ramp: GILL, line: true },
    { part: "body", e: [20, 29.5, 7.2, 6.4], ramp: PINK },
    { part: "belly", e: [21, 30.6, 4.4, 4.4], ramp: BELLY },
    ...feet(PINK),
    { part: "head", e: [20, 14.6, 12.8, 9], ramp: PINK, line: true },
    ...paws(PINK),
  ],
  eyes: [at(13, 12), at(24, 12)],
  iris: "#7a2350",
  mouth: { at: [17, 18], pat: ["k.....k", ".kpppk.", "..kkk.."], key: { k: INK, p: "#ff6b8a" } },
  cheeks: { at: [at(11, 18), at(29, 18)], color: "#ff7aa6" },
  marks: [
    { at: [12, 8], pat: ["g"], key: { g: "#f070aa" } },
    { at: [27, 7], pat: ["gg"], key: { g: "#f070aa" } },
    { at: [30, 11], pat: ["g"], key: { g: "#f070aa" } },
  ],
  anchors: { cx: 20, hatY: 5, neckY: 23, bodyRx: 7.2, feetY: 37 },
};

// ---- Mungge: a cloud lamb, a puffy woolly silhouette, little blue horns and a star ----
const WOOL: Ramp = ["#ffffff", "#f3f6ff", "#cad6f0", "#6a78a8"];
const FACE: Ramp = ["#fff4e6", "#f6d8b8", "#dcae86", "#8a5a3c"];
const SKY: Ramp = ["#d8f2ff", "#86d0ff", "#4aa3db", "#2a5f8a"];
const MUNGGE: PetSpec = {
  shapes: [
    { part: "tail", e: [10, 29, 3.2, 3.2], ramp: WOOL, line: true },
    { part: "foot", e: [16, 36, 2.3, 1.8], ramp: FACE },
    { part: "foot", e: [24, 36.2, 2.3, 1.8], ramp: FACE },
    { part: "body", e: [20, 29.6, 8.2, 6.4], ramp: WOOL },
    { part: "body", e: [14, 33, 2.8, 2.6], ramp: WOOL },
    { part: "body", e: [19.5, 34.4, 2.8, 2.6], ramp: WOOL },
    { part: "body", e: [25.5, 33.4, 2.8, 2.6], ramp: WOOL },
    { part: "fluff", e: [20, 14, 10, 8], ramp: WOOL, line: true },
    { part: "fluff", e: [12, 10, 4.6, 4.6], ramp: WOOL },
    { part: "fluff", e: [17, 6.4, 4.6, 4.6], ramp: WOOL },
    { part: "fluff", e: [23.5, 6.4, 4.6, 4.6], ramp: WOOL },
    { part: "fluff", e: [28.5, 10, 4.6, 4.6], ramp: WOOL },
    { part: "fluff", e: [30.2, 16, 4, 4], ramp: WOOL },
    { part: "fluff", e: [9.8, 16, 4, 4], ramp: WOOL },
    { part: "fluff", e: [13, 21, 3.8, 3.4], ramp: WOOL },
    { part: "fluff", e: [27.5, 21, 3.8, 3.4], ramp: WOOL },
    { part: "head", e: [21, 16.4, 7.2, 6.2], ramp: FACE, line: true },
    { part: "horn", e: [11.6, 13.6, 2.4, 2.4], ramp: SKY, line: true },
    { part: "horn", e: [30.6, 13.6, 2.1, 2.1], ramp: SKY, line: true },
    ...paws(FACE),
  ],
  eyes: [at(16, 13), at(23, 13)],
  iris: "#8a5a3c",
  mouth: { ...SMILE, at: [21, 19] },
  cheeks: { at: [at(15, 19), at(27, 19)], color: "#ff9fb8" },
  marks: [
    { at: [11, 13], pat: ["s"], key: { s: "#2a5f8a" } },
    { at: [30, 13], pat: ["s"], key: { s: "#2a5f8a" } },
    { at: [19, 4], pat: [".s.", "sss", ".s."], key: { s: "#4aa3db" } },
  ],
  anchors: { cx: 20, hatY: 2, neckY: 23, bodyRx: 8.2, feetY: 37.5 },
};

export const PET_SPECS: Record<PetId, PetSpec> = { cat: CAT, upa: UPA, mungge: MUNGGE, mochi: MOCHI };
