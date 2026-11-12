import { expect, test } from "bun:test";
import { makeInitial, type Game } from "../game";
import { CONTINUE_BTN, PET_CENTER, SLOT_CARDS } from "../layout";
import { DEFAULT_SETTINGS, FRESH_ACCOUNT, freshSlot, type Loaded } from "../state";
import { drive } from "./drive";

const loaded: Loaded = { account: FRESH_ACCOUNT, slots: [freshSlot("cat"), null, null], settings: DEFAULT_SETTINGS, migrated: false, firstRun: false };
const playing = (): Game => drive(makeInitial(loaded), { 5: { click: CONTINUE_BTN }, 15: { click: SLOT_CARDS[0] } }, 20);

test("the pet starts in the middle, facing right", () => {
  const g = playing();
  expect(g.petX).toBe(PET_CENTER.x);
  expect(g.facing).toBe("right");
});

test("arrow keys walk the pet, and it turns to face the way it goes", () => {
  let g = drive(playing(), { 20: { hold: ["ArrowLeft"] }, 50: { hold: [] } }, 40, 20);
  expect(g.petX).toBeLessThan(PET_CENTER.x - 150);
  expect(g.facing).toBe("left");
  expect(g.walking).toBe(false);
  const x = g.petX;
  g = drive(g, { 60: { hold: ["d"] } }, 10, 60);
  expect(g.petX).toBeGreaterThan(x);
  expect(g.facing).toBe("right");
  expect(g.walking).toBe(true);
});

test("the pet stays on the field", () => {
  let g = drive(playing(), { 20: { hold: ["ArrowLeft"] } }, 1000, 20);
  const left = g.petX;
  expect(left).toBeGreaterThanOrEqual(150);
  g = drive(g, { 1020: { hold: ["ArrowRight"] } }, 1000, 1020);
  expect(g.petX).toBeLessThanOrEqual(1450);
  expect(g.petX).toBeGreaterThan(left);
});

test("a tap lands where the pet is now", () => {
  let g = drive(playing(), { 20: { hold: ["a"] }, 80: { hold: [] } }, 70, 20);
  const taps = g.taps;
  g = drive(g, { 90: { click: PET_CENTER } }, 10, 90);
  expect(g.taps).toBe(taps);
  g = drive(g, { 100: { click: { x: g.petX, y: PET_CENTER.y } } }, 10, 100);
  expect(g.taps).toBe(taps + 1);
});
