import { expect, test } from "bun:test";
import { SUN_FRAMES } from "../state";
import { skyAt } from "../ui/skyAt";

const at = (k: number) => skyAt(Math.round(k * SUN_FRAMES));

test("the day's phases", () => {
  expect(at(0).sun).not.toBeNull();
  expect(at(0.35).sun!.y).toBeLessThan(at(0.05).sun!.y);
  expect(at(0.85).sun).toBeNull();
  expect(at(0.85).moon).not.toBeNull();
  expect(at(0.85).stars).toBeGreaterThan(0);
  expect(at(0.35).stars).toBe(0);
  expect(at(0.35).moon).toBeNull();
});

test("six bands of sky, a different look by phase", () => {
  for (const k of [0, 0.1, 0.35, 0.6, 0.85]) expect(at(k).bands.length).toBe(6);
  expect(at(0.35).bands).not.toEqual(at(0.85).bands);
  expect(at(0.6).bands).not.toEqual(at(0.35).bands);
});

test("same time, same sky", () => {
  expect(skyAt(12345)).toEqual(skyAt(12345));
  expect(skyAt(SUN_FRAMES - 1)).toEqual(skyAt(SUN_FRAMES - 1));
});
