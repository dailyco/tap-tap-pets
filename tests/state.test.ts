import { expect, test } from "bun:test";
import { DEFAULT_SETTINGS, FRESH_ACCOUNT, checkAccount, checkSettings, checkSlot, freshSlot, loadFrom } from "../state";

test("old main save becomes a cat in slot 1", () => {
  const disk: Record<string, unknown> = { main: { coins: 84, earned: 300, tools: { pickaxe: 2, gloves: 1 }, owned: ["cap", "tee"], wear: { hat: "cap", body: "tee", acc: null } } };
  const l = loadFrom((k) => disk[k] ?? null);
  expect(l.migrated).toBe(true);
  expect(l.slots[0]).toEqual({ pet: "cat", coins: 84, earned: 300, tools: [2, 1, 0], owned: ["cap", "tee"], wear: { hat: "cap", body: "tee", acc: null }, playFrames: 0 });
  expect(l.slots[1]).toBeNull();
  expect(l.slots[2]).toBeNull();
  expect(l.account).toEqual(FRESH_ACCOUNT);
  expect(l.settings).toEqual(DEFAULT_SETTINGS);
});

test("the old save moves only on the first run (no account row yet)", () => {
  const disk: Record<string, unknown> = { main: { coins: 84 }, account: { sun: 1, pets: ["cat"] } };
  const l = loadFrom((k) => disk[k] ?? null);
  expect(l.migrated).toBe(false);
  expect(l.slots).toEqual([null, null, null]);
  expect(l.firstRun).toBe(false);
  expect(loadFrom(() => null).firstRun).toBe(true);
});

test("slots on disk win over main", () => {
  const disk: Record<string, unknown> = { slot1: freshSlot("upa"), main: { coins: 84 } };
  const l = loadFrom((k) => disk[k] ?? null);
  expect(l.migrated).toBe(false);
  expect(l.slots[0]?.pet).toBe("upa");
});

test("a save in slot 3 only still wins over main", () => {
  const disk: Record<string, unknown> = { slot3: freshSlot("mochi"), main: { coins: 84 } };
  const l = loadFrom((k) => disk[k] ?? null);
  expect(l.migrated).toBe(false);
  expect(l.slots).toEqual([null, null, freshSlot("mochi")]);
});

test("nothing on disk: everything fresh", () => {
  const l = loadFrom(() => null);
  expect(l).toEqual({ account: FRESH_ACCOUNT, slots: [null, null, null], settings: DEFAULT_SETTINGS, migrated: false, firstRun: true });
});

test("broken data falls back", () => {
  expect(checkSlot({ pet: "dog" })).toBeNull();
  expect(checkSlot("nope")).toBeNull();
  expect(checkAccount({ sun: -3, pets: ["mochi", "x"] })).toEqual({ sun: 0, sunFrames: 0, pets: ["cat", "mochi"] });
  expect(checkSettings({ lang: "fr", sound: false })).toEqual({ autosave: true, sound: false, bgm: true, lang: "ko" });
  expect(checkSettings({ lang: "en" }).lang).toBe("en");
});

test("wear only keeps owned items in their own slot", () => {
  const s = checkSlot({ ...freshSlot("cat"), owned: ["cap"], wear: { hat: "crown", body: "cap", acc: null } });
  expect(s?.wear).toEqual({ hat: null, body: null, acc: null });
  const t = checkSlot({ ...freshSlot("cat"), owned: ["cap"], wear: { hat: "cap", body: null, acc: null } });
  expect(t?.wear.hat).toBe("cap");
});

test("cat is always owned, sunFrames stays inside a day", () => {
  expect(checkAccount({ sun: 2, sunFrames: 100, pets: [] }).pets).toEqual(["cat"]);
  expect(checkAccount({ sun: 2, sunFrames: 999_999, pets: ["cat"] }).sunFrames).toBe(0);
});

test("a slot saved with two tools loads with the speed tool at its start", () => {
  expect(checkSlot({ pet: "upa", coins: 5, tools: [3, 2] })?.tools).toEqual([3, 2, 0]);
  expect(checkSlot({ pet: "upa", coins: 5, tools: [3, 2, 4] })?.tools).toEqual([3, 2, 4]);
  expect(freshSlot("cat").tools).toEqual([0, 0, 0]);
});

test("settings: the music is on unless it was turned off (older saves have it on)", () => {
  expect(DEFAULT_SETTINGS.bgm).toBe(true);
  expect(checkSettings({ autosave: false, sound: true, lang: "en" }).bgm).toBe(true);
  expect(checkSettings({ bgm: false }).bgm).toBe(false);
});
