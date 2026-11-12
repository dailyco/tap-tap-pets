import { expect, test } from "bun:test";
import { makeInitial, petCard, slotSummary, step, type Game } from "../game";
import { ASK_HOME, CONTINUE_BTN, DEL_CANCEL, DEL_OK, GEAR_HOME, LANG_EN, LANG_KO, LANG_ROW, NEW_BTN, PET_BUY, PET_CARDS, PET_CENTER, PETS_BTN, SAVE_BTN, SLOT_CARDS, SLOT_DELETE } from "../layout";
import { DEFAULT_SETTINGS, FRESH_ACCOUNT, freshSlot, type Loaded, type SlotData } from "../state";
import { drive } from "./drive";

const loaded = (over: Partial<Loaded> = {}): Loaded => ({ account: FRESH_ACCOUNT, slots: [null, null, null], settings: DEFAULT_SETTINGS, migrated: false, firstRun: false, ...over });
const cat84: SlotData = { ...freshSlot("cat"), coins: 84 };

test("continue opens the slots; a saved slot plays", () => {
  let g = drive(makeInitial(loaded({ slots: [cat84, null, null] })), { 5: { click: CONTINUE_BTN } }, 20);
  expect(g.homeView).toBe("continue");
  g = drive(g, { 20: { click: SLOT_CARDS[0] } }, 20, 20);
  expect(g.phase).toBe("play");
  expect(g.cur).toBe(0);
  expect(g.p.coins).toBe(84);
});

test("continue with nothing saved stays put", () => {
  const g = drive(makeInitial(loaded()), { 5: { click: CONTINUE_BTN } }, 20);
  expect(g.homeView).toBe("main");
  expect(g.fails).toBe(1);
});

test("new game into an empty slot: pick an owned pet", () => {
  let g = drive(makeInitial(loaded()), { 5: { click: NEW_BTN }, 20: { click: SLOT_CARDS[1] } }, 30);
  expect(g.homeView).toBe("pick");
  expect(g.target).toBe(1);
  g = drive(g, { 30: { click: PET_BUY[3] } }, 15, 30);
  expect(g.homeView).toBe("pick");
  g = drive(g, { 45: { click: PET_BUY[0] } }, 10, 45);
  expect(g.phase).toBe("play");
  expect(g.cur).toBe(1);
  expect({ ...g.p, playFrames: 0 }).toEqual(freshSlot("cat"));
  expect(g.saveN).toBe(1);
});

test("new game over a saved slot asks first; cancelling keeps it", () => {
  let g = drive(makeInitial(loaded({ slots: [cat84, null, null] })), { 5: { click: NEW_BTN }, 20: { click: SLOT_CARDS[0] } }, 30);
  expect(g.homeView).toBe("overwrite");
  g = drive(g, { 30: { click: DEL_CANCEL } }, 10, 30);
  expect(g.homeView).toBe("new");
  expect(g.slots[0]).toEqual(cat84);
  g = drive(g, { 40: { click: SLOT_CARDS[0] }, 55: { click: DEL_OK } }, 20, 40);
  expect(g.homeView).toBe("pick");
  expect(g.slots[0]).toEqual(cat84);
  g = drive(g, { 60: { keys: ["Escape"] } }, 5, 60);
  expect(g.homeView).toBe("new");
  expect(g.slots[0]).toEqual(cat84);
  g = drive(g, { 70: { click: SLOT_CARDS[0] }, 85: { click: DEL_OK }, 100: { click: PET_BUY[0] } }, 10 + 40, 70);
  expect(g.phase).toBe("play");
  expect(g.slots[0]).toEqual(freshSlot("cat"));
  expect(g.p.owned).toEqual([]);
});

test("buy a pet with sunlight", () => {
  let g = drive(makeInitial(loaded({ account: { ...FRESH_ACCOUNT, sun: 3 } })), { 5: { click: PETS_BTN }, 20: { click: PET_BUY[1] } }, 40);
  expect(g.homeView).toBe("pets");
  expect(g.acc).toEqual({ sun: 0, sunFrames: 0, pets: ["cat", "upa"] });
  expect(g.accN).toBe(1);
  expect(g.reveal?.pet).toBe("upa");
  g = drive(makeInitial(loaded({ account: { ...FRESH_ACCOUNT, sun: 2 } })), { 5: { click: PETS_BTN }, 20: { click: PET_BUY[1] } }, 40);
  expect(g.acc.sun).toBe(2);
  expect(g.acc.pets).toEqual(["cat"]);
  expect(g.fails).toBe(1);
  expect(g.accN).toBe(0);
});

test("an unowned card hides its name", () => {
  expect(petCard(FRESH_ACCOUNT, "mochi")).toEqual({ name: "pet.unknown", owned: false, price: 8, canBuy: false });
  expect(petCard({ ...FRESH_ACCOUNT, sun: 9, pets: ["cat", "mochi"] }, "mochi")).toEqual({ name: "pet.mochi", owned: true, price: 8, canBuy: false });
  expect(petCard({ ...FRESH_ACCOUNT, sun: 9 }, "mungge").canBuy).toBe(true);
});

test("a slot's summary", () => {
  expect(slotSummary(null)).toBeNull();
  expect(slotSummary({ ...cat84, owned: ["cap", "tee"], playFrames: 60 * 60 * 7 })).toEqual({ pet: "cat", coins: 84, style: 2, minutes: 7 });
});

test("delete asks first, from the slots", () => {
  let g = drive(makeInitial(loaded({ slots: [cat84, freshSlot("cat"), null] })), { 5: { click: CONTINUE_BTN }, 20: { click: SLOT_DELETE[0] } }, 30);
  expect(g.homeView).toBe("delete");
  expect(g.target).toBe(0);
  g = drive(g, { 30: { click: DEL_CANCEL } }, 10, 30);
  expect(g.homeView).toBe("continue");
  expect(g.slots[0]).toEqual(cat84);
  g = drive(g, { 40: { click: SLOT_DELETE[0] }, 60: { click: DEL_OK } }, 30, 40);
  expect(g.slots[0]).toBeNull();
  expect(g.slots[1]).toEqual(freshSlot("cat"));
  expect(g.delN).toBe(1);
  expect(g.delSlot).toBe(0);
  expect(g.homeView).toBe("continue");
});

test("three full slots: a new game overwrites one", () => {
  const g = drive(makeInitial(loaded({ slots: [cat84, cat84, cat84] })), { 5: { click: NEW_BTN }, 20: { click: SLOT_CARDS[2] }, 35: { click: DEL_OK } }, 45);
  expect(g.homeView).toBe("pick");
  expect(g.target).toBe(2);
});

test("slots keep their own coins", () => {
  let g = drive(makeInitial(loaded({ slots: [cat84, null, null] })), { 5: { click: CONTINUE_BTN }, 15: { click: SLOT_CARDS[0] }, 30: { click: PET_CENTER }, 40: { click: PET_CENTER }, 60: { click: SAVE_BTN }, 80: { click: ASK_HOME } }, 100);
  expect(g.phase).toBe("home");
  expect(g.homeView).toBe("main");
  expect(g.slots[0]?.coins).toBe(84 + 2 * 3 + 1);
  g = drive(g, { 100: { click: NEW_BTN }, 110: { click: SLOT_CARDS[1] }, 125: { click: PET_BUY[0] } }, 30, 100);
  expect(g.cur).toBe(1);
  expect(g.p.coins).toBe(0);
  g = drive(g, { 130: { click: SAVE_BTN }, 150: { click: ASK_HOME }, 170: { click: CONTINUE_BTN }, 185: { click: SLOT_CARDS[0] } }, 60, 130);
  expect(g.cur).toBe(0);
  expect(g.p.coins).toBe(84 + 2 * 3 + 1);
});

test("language tabs: pick one, picking it again changes nothing", () => {
  let g = drive(makeInitial(loaded()), { 5: { click: GEAR_HOME }, 20: { click: LANG_EN } }, 40);
  expect(g.set.lang).toBe("en");
  expect(g.setN).toBe(1);
  g = drive(g, { 40: { click: LANG_EN } }, 20, 40);
  expect(g.set.lang).toBe("en");
  expect(g.setN).toBe(1);
  g = drive(g, { 60: { click: LANG_KO } }, 20, 60);
  expect(g.set.lang).toBe("ko");
  expect(g.setN).toBe(2);
  g = drive(g, { 80: { click: [LANG_ROW.x + 30, LANG_ROW.y + 50] } }, 20, 80);
  expect(g.set.lang).toBe("ko");
  expect(g.settings).toBe(true);
});

test("a first run writes the account at once, so the old save is never moved again", () => {
  expect(drive(makeInitial(loaded({ firstRun: true })), {}, 2).accN).toBe(1);
  expect(drive(makeInitial(loaded({ firstRun: false })), {}, 2).accN).toBe(0);
});

test("disk only joins on a live frame", () => {
  let g: Game = makeInitial(loaded({ slots: [cat84, null, null], account: { ...FRESH_ACCOUNT, sun: 5 } }));
  for (let f = 0; f < 30; f++) g = step(g, { keys: [] }, f);
  expect(g.slots).toEqual([null, null, null]);
  expect(g.acc.sun).toBe(0);
  g = drive(g, {}, 1, 30);
  expect(g.slots[0]).toEqual(cat84);
  expect(g.acc.sun).toBe(5);
});

test("escape and an outside click step back out of the home's panels", () => {
  let g = drive(makeInitial(loaded()), { 5: { click: PETS_BTN }, 20: { keys: ["Escape"] } }, 30);
  expect(g.homeView).toBe("main");
  g = drive(g, { 30: { click: PETS_BTN }, 45: { click: [40, 880] } }, 30, 30);
  expect(g.homeView).toBe("main");
  g = drive(g, { 60: { click: NEW_BTN }, 75: { keys: ["Escape"] } }, 30, 60);
  expect(g.homeView).toBe("main");
  expect(PET_CARDS.length).toBe(4);
});

test("number keys pick or buy in the pets panels", () => {
  let g = drive(makeInitial(loaded()), { 3: { keys: ["n"] }, 10: { keys: ["2"] }, 20: { keys: ["1"] } }, 40);
  expect(g.phase).toBe("play");
  expect(g.cur).toBe(1);
  expect(g.p.pet).toBe("cat");
  g = drive(makeInitial(loaded({ account: { ...FRESH_ACCOUNT, sun: 5 } })), { 5: { keys: ["p"] }, 20: { keys: ["3"] } }, 40);
  expect(g.acc.pets).toEqual(["cat", "mungge"]);
  expect(g.reveal?.pet).toBe("mungge");
});
