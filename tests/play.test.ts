import { expect, test } from "bun:test";
import { MAX_POPS, makeInitial, type Game } from "../game";
import { ASK_HOME, CONTINUE_BTN, GEAR_PLAY, GROUND, PET_CENTER, PETS_BTN, SAVE_BTN, SLOT_CARDS, rowBox } from "../layout";
import { hash } from "../pets";
import { DEFAULT_SETTINGS, FRESH_ACCOUNT, SUN_FRAMES, freshSlot, type Loaded, type SlotData } from "../state";
import { drive } from "./drive";

const loaded = (over: Partial<Loaded> = {}): Loaded => ({ account: FRESH_ACCOUNT, slots: [freshSlot("cat"), null, null], settings: DEFAULT_SETTINGS, migrated: false, firstRun: false, ...over });
/** slot 1 continued (CONTINUE at frame 5, the slot at 15); play from frame 20 on */
const playing = (over: Partial<Loaded> = {}): Game => drive(makeInitial(loaded(over)), { 5: { click: CONTINUE_BTN }, 15: { click: SLOT_CARDS[0] } }, 20);

test("a sunlight every 72000 play frames", () => {
  let g = playing();
  expect(g.phase).toBe("play");
  const acc0 = g.accN;
  g = drive(g, {}, SUN_FRAMES - 16, 20);
  expect(g.acc.sun).toBe(0);
  g = drive(g, {}, 20, 20 + SUN_FRAMES - 16);
  expect(g.acc.sun).toBe(1);
  expect(g.suns).toBe(1);
  expect(g.sunT).toBeGreaterThan(0);
  expect(g.accN).toBeGreaterThan(acc0);
});

test("no sunlight on the home screen or in its panels", () => {
  let g = drive(makeInitial(loaded()), { 5: { click: PETS_BTN } }, 5000);
  expect(g.homeView).toBe("pets");
  expect(g.acc.sunFrames).toBe(0);
});

test("it keeps flowing with settings or the save question open", () => {
  let g = playing();
  const f0 = g.acc.sunFrames;
  g = drive(g, { 20: { click: GEAR_PLAY } }, 1000, 20);
  expect(g.settings).toBe(true);
  expect(g.acc.sunFrames - f0).toBe(1000);
  g = drive(g, { 1020: { keys: ["Escape"] }, 1040: { click: SAVE_BTN } }, 500, 1020);
  expect(g.ask).toBe(true);
  expect(g.acc.sunFrames - f0).toBe(1500);
});

test("the timer survives going home, and play time is counted", () => {
  let g = playing();
  g = drive(g, { 30_000: { click: SAVE_BTN }, 30_020: { click: ASK_HOME } }, 30_030, 20);
  expect(g.phase).toBe("home");
  const atHome = g.acc.sunFrames;
  expect(atHome).toBeGreaterThanOrEqual(30_000);
  expect(atHome).toBeLessThan(30_040);
  expect(g.slots[0]!.playFrames).toBeGreaterThanOrEqual(30_000);
  g = drive(g, { 30_050: { click: CONTINUE_BTN }, 30_065: { click: SLOT_CARDS[0] } }, 100, 30_050);
  expect(g.phase).toBe("play");
  expect(g.acc.sunFrames).toBeGreaterThan(atHome);
  expect(g.acc.sunFrames - atHome).toBeLessThan(100);
});

test("account saves every 600 frames even with auto save off", () => {
  let g = playing({ settings: { ...DEFAULT_SETTINGS, autosave: false } });
  const acc0 = g.accN, save0 = g.saveN;
  g = drive(g, {}, 1200, 20);
  expect(g.accN - acc0).toBe(2);
  expect(g.saveN - save0).toBe(0);
});

test("going home saves the account too", () => {
  let g = playing({ settings: { ...DEFAULT_SETTINGS, autosave: false } });
  const acc0 = g.accN;
  g = drive(g, { 30: { click: SAVE_BTN }, 50: { click: ASK_HOME } }, 40, 20);
  expect(g.phase).toBe("home");
  expect(g.accN).toBeGreaterThan(acc0);
});

test("shop rows are the pet's tools", () => {
  const mungge: SlotData = { ...freshSlot("mungge"), coins: 40 };
  let g = playing({ slots: [mungge, null, null], account: { ...FRESH_ACCOUNT, pets: ["cat", "mungge"] } });
  g = drive(g, { 21: { keys: ["s"] }, 30: { click: rowBox(0) } }, 20, 20);
  expect(g.p.tools).toEqual([1, 0, 0]);
  expect(g.p.coins).toBe(0);
});

test("upa jackpot taps", () => {
  // a frame (after play starts, off a payout second) whose tap is a jackpot, and one whose tap isn't
  const quiet = (f: number) => (f + 1) % 60 !== 0;
  let jack = 40, plain = 40;
  while (hash((jack + 1) * 31 + 7) >= 0.01 || !quiet(jack)) jack++;
  while (hash((plain + 1) * 31 + 7) < 0.01 || !quiet(plain)) plain++;
  for (const [f, coins, big] of [[jack, 10, true], [plain, 2, false]] as const) {
    let g = playing({ slots: [freshSlot("upa"), null, null], account: { ...FRESH_ACCOUNT, pets: ["cat", "upa"] } });
    g = drive(g, {}, f - 20, 20);
    const before = g.p.coins;
    g = drive(g, { [f]: { keys: [" "] } }, 1, f);
    expect(g.p.coins - before).toBe(coins);
    expect(!!g.pops.at(-1)!.big).toBe(big);
    expect(g.jackpots).toBe(big ? 1 : 0);
  }
});

test("autosave off: a sunlight still saves the account the moment it comes", () => {
  let g: Game = playing({ settings: { ...DEFAULT_SETTINGS, autosave: false }, account: { ...FRESH_ACCOUNT, sunFrames: SUN_FRAMES - 15 } });
  expect(g.acc.sun).toBe(0);
  const acc0 = g.accN;
  g = drive(g, {}, 20, 20);
  expect(g.acc.sun).toBe(1);
  expect(g.accN).toBeGreaterThan(acc0);
});

test("tapping as fast as keys go: every tap pays, the effects on screen stay a handful", () => {
  let g = playing({});
  g = drive(g, {}, 20, 0);
  const taps0 = g.taps;
  let most = { pops: 0, chips: 0 };
  for (let f = 20; f < 140; f++) {
    g = drive(g, f % 2 === 0 ? { [f]: { keys: [" "] } } : {}, 1, f);
    most = { pops: Math.max(most.pops, g.pops.length), chips: Math.max(most.chips, g.chips.length) };
  }
  expect(g.taps - taps0).toBe(60);
  expect(most.pops).toBeLessThanOrEqual(MAX_POPS);
  expect(most.chips).toBeLessThanOrEqual(12);
});

test("the speed tool: coins come in several times a second, each with its own +N; one coin sound a second", () => {
  const cat: SlotData = { ...freshSlot("cat"), tools: [0, 0, 2] };
  let g = playing({ slots: [cat, null, null] });
  const c0 = g.p.coins, pay0 = g.payouts, before = new Set(g.pops);
  let moves = 0;
  for (let f = 20; f < 80; f++) {
    const before = g.p.coins;
    g = drive(g, {}, 1, f);
    if (g.p.coins !== before) moves++;
  }
  expect(moves).toBe(3);
  expect(g.p.coins - c0).toBe(3);
  expect(g.payouts - pay0).toBe(1);
  const idle = g.pops.filter((p) => p.idle && !before.has(p));
  expect(idle.map((p) => p.n)).toEqual([1, 1, 1]);
  expect(idle.every((p) => p.quick)).toBe(true);
  expect(new Set(idle.map((p) => p.x)).size).toBeGreaterThan(1);
});

test("one payout a second: its +N as before, where it always was", () => {
  let g = playing({});
  g = drive(g, {}, 70, 20);
  const idle = g.pops.filter((p) => p.idle);
  expect(idle.length).toBeGreaterThan(0);
  expect(idle.every((p) => !p.quick && p.x === idle[0].x)).toBe(true);
});

test("the shop's third row buys the speed tool, and a full one can't be bought", () => {
  let g = playing({ slots: [{ ...freshSlot("cat"), coins: 10_000 }, null, null] });
  g = drive(g, { 21: { keys: ["s"] }, 30: { click: rowBox(2) } }, 20, 20);
  expect(g.p.tools).toEqual([0, 0, 1]);
  expect(g.p.coins).toBe(0);
  let h = playing({ slots: [{ ...freshSlot("cat"), coins: 1e15, tools: [0, 0, 9] }, null, null] });
  const fails = h.fails;
  h = drive(h, { 21: { keys: ["s"] }, 30: { click: rowBox(2) } }, 20, 20);
  expect(h.p.tools).toEqual([0, 0, 9]);
  expect(h.fails).toBe(fails + 1);
});

test("ten payouts a second: their +N spread all round the pet, on the field", () => {
  const cat: SlotData = { ...freshSlot("cat"), tools: [0, 0, 9] };
  let g = playing({ slots: [cat, null, null] });
  const before = new Set(g.pops);
  g = drive(g, {}, 60, 20);
  const quick = g.pops.filter((p) => p.idle && !before.has(p));
  expect(quick.length).toBeGreaterThanOrEqual(8);
  // the label sits right of its x (coin at x - 70): its middle is about x + 30
  const mid = (p: { x: number }) => p.x + 30;
  expect(quick.some((p) => mid(p) < g.petX - 120)).toBe(true);
  expect(quick.some((p) => mid(p) > g.petX + 120)).toBe(true);
  expect(Math.max(...quick.map((p) => p.y)) - Math.min(...quick.map((p) => p.y))).toBeGreaterThan(150);
  for (const p of quick) {
    expect(p.x - 70).toBeGreaterThanOrEqual(0);
    expect(p.x + 160).toBeLessThanOrEqual(1600);
    expect(p.y).toBeGreaterThanOrEqual(100);
    expect(p.y).toBeLessThanOrEqual(GROUND - 60);
  }
});
