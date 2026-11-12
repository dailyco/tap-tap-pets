import { expect, test } from "bun:test";
import { ICONS } from "../art";
import { PET_H, PET_W, petRects, silhouetteRects } from "../petArt";
import { PETS } from "../pets";

const NONE = { hat: null, body: null, acc: null };
const POSES = ["mid", "up", "down", "squash"] as const;
const EYES = ["open", "blink", "happy"] as const;

test("every pet, pose and eye draws inside the canvas", () => {
  for (const p of PETS) for (const pose of POSES) for (const e of EYES) {
    const r = petRects(p.id, pose, e, NONE);
    expect(r.length).toBeGreaterThan(20);
    for (const [x, y, w, h] of r) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x + w).toBeLessThanOrEqual(PET_W);
      expect(y + h).toBeLessThanOrEqual(PET_H);
    }
  }
});

test("poses and eyes change the picture", () => {
  for (const p of PETS) {
    expect(petRects(p.id, "up", "open", NONE)).not.toEqual(petRects(p.id, "mid", "open", NONE));
    expect(petRects(p.id, "mid", "blink", NONE)).not.toEqual(petRects(p.id, "mid", "open", NONE));
  }
});

test("silhouettes are one colour and the pet's own shape", () => {
  for (const p of PETS) {
    const s = silhouetteRects(p.id);
    expect(new Set(s.map((r) => r[4]))).toEqual(new Set(["#120a20"]));
    const area = (rs: [number, number, number, number, string][]) => rs.reduce((n, r) => n + r[2] * r[3], 0);
    expect(area(s)).toBe(area(petRects(p.id, "mid", "open", NONE)));
  }
});

test("every pet wears every item", () => {
  const has = (rects: [number, number, number, number, string][], c: string) => rects.some((r) => r[4] === c);
  for (const p of PETS) {
    expect(has(petRects(p.id, "mid", "open", { ...NONE, hat: "crown" }), "#ffd23f")).toBe(true);
    expect(has(petRects(p.id, "mid", "open", { ...NONE, hat: "cap" }), "#3a86ff")).toBe(true);
    expect(has(petRects(p.id, "mid", "open", { ...NONE, hat: "ribbon" }), "#ff4d6d")).toBe(true);
    expect(has(petRects(p.id, "mid", "open", { ...NONE, body: "tee" }), "#4cc9f0")).toBe(true);
    expect(has(petRects(p.id, "mid", "open", { ...NONE, body: "cape" }), "#d62828")).toBe(true);
    expect(has(petRects(p.id, "mid", "open", { ...NONE, acc: "shades" }), "#3d3d6b")).toBe(true);
    expect(has(petRects(p.id, "mid", "open", { ...NONE, acc: "scarf" }), "#2a9d8f")).toBe(true);
    expect(has(petRects(p.id, "squash", "happy", { hat: "crown", body: "cape", acc: "shades" }), "#ffd23f")).toBe(true);
  }
});

test("cached", () => {
  expect(petRects("mochi", "up", "open", NONE)).toBe(petRects("mochi", "up", "open", NONE));
});

test("every tool has an icon, and the sun and the bin", () => {
  for (const p of PETS) for (const t of p.tools) expect(ICONS[t.icon]).toBeDefined();
  expect(ICONS.sun).toBeDefined();
  expect(ICONS.trash).toBeDefined();
});
