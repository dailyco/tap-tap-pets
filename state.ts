// What the game keeps: three save slots (one pet's run each), the account they share (sunlight, the pets owned) and
// the settings. Everything read from disk is checked field by field here; anything unknown or broken falls back.
import { ITEMS, itemOf, type Slot } from "./items";
import type { SaveKey } from "./save";

export type PetId = "cat" | "upa" | "mungge" | "mochi";
export const PET_IDS: PetId[] = ["cat", "upa", "mungge", "mochi"];

export interface Wear { hat: string | null; body: string | null; acc: string | null }

/** one slot: a pet's run */
export interface SlotData {
  pet: PetId;
  coins: number;
  earned: number;
  /** the pet's two tools' levels: [coins a second, coins a tap] */
  tools: [number, number];
  owned: string[];
  wear: Wear;
  playFrames: number;
}

/** shared by every slot */
export interface Account { sun: number; sunFrames: number; pets: PetId[] }

export type Lang = "ko" | "en";
export interface Settings { autosave: boolean; sound: boolean; lang: Lang }

/** a sunlight for every 20 minutes on the play screen, at 60 fps */
export const SUN_FRAMES = 72_000;

export const freshSlot = (pet: PetId): SlotData =>
  ({ pet, coins: 0, earned: 0, tools: [0, 0], owned: [], wear: { hat: null, body: null, acc: null }, playFrames: 0 });
export const FRESH_ACCOUNT: Account = { sun: 0, sunFrames: 0, pets: ["cat"] };
export const DEFAULT_SETTINGS: Settings = { autosave: true, sound: true, lang: "ko" };

export type Slots = [SlotData | null, SlotData | null, SlotData | null];
/** firstRun: no account row on disk yet (this is the first run of this version): the old save moves only then */
export interface Loaded { account: Account; slots: Slots; settings: Settings; migrated: boolean; firstRun: boolean }

const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
/** a non-negative finite number (coins may have fractions), else 0 */
const amount = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0);
const whole = (v: unknown) => Math.floor(amount(v));

const ownedOf = (v: unknown) => (Array.isArray(v) ? ITEMS.map((it) => it.id).filter((id) => v.includes(id)) : []);
function wearOf(v: unknown, owned: string[]): Wear {
  const w = obj(v) ?? {};
  const worn = (slot: Slot) => {
    const id = w[slot];
    return typeof id === "string" && owned.includes(id) && itemOf(id)?.slot === slot ? id : null;
  };
  return { hat: worn("hat"), body: worn("body"), acc: worn("acc") };
}

export function checkSlot(raw: unknown): SlotData | null {
  const r = obj(raw);
  if (!r || !PET_IDS.includes(r.pet as PetId)) return null;
  const tools = Array.isArray(r.tools) ? r.tools : [];
  const owned = ownedOf(r.owned);
  return {
    pet: r.pet as PetId, coins: amount(r.coins), earned: amount(r.earned), tools: [whole(tools[0]), whole(tools[1])],
    owned, wear: wearOf(r.wear, owned), playFrames: whole(r.playFrames),
  };
}

/** the one save the game kept before slots: a cat, its pickaxe now the cat's coins-a-second tool, its gloves the tap tool */
export function migrateMain(raw: unknown): SlotData | null {
  const r = obj(raw);
  if (!r) return null;
  const tools = obj(r.tools) ?? {};
  const owned = ownedOf(r.owned);
  return {
    pet: "cat", coins: amount(r.coins), earned: amount(r.earned), tools: [whole(tools.pickaxe), whole(tools.gloves)],
    owned, wear: wearOf(r.wear, owned), playFrames: 0,
  };
}

export function checkAccount(raw: unknown): Account {
  const r = obj(raw) ?? {};
  const pets = Array.isArray(r.pets) ? r.pets : [];
  const frames = whole(r.sunFrames);
  return { sun: whole(r.sun), sunFrames: frames < SUN_FRAMES ? frames : 0, pets: PET_IDS.filter((p) => p === "cat" || pets.includes(p)) };
}

export function checkSettings(raw: unknown): Settings {
  const r = obj(raw) ?? {};
  return {
    autosave: typeof r.autosave === "boolean" ? r.autosave : DEFAULT_SETTINGS.autosave,
    sound: typeof r.sound === "boolean" ? r.sound : DEFAULT_SETTINGS.sound,
    lang: r.lang === "en" || r.lang === "ko" ? r.lang : DEFAULT_SETTINGS.lang,
  };
}

/** everything kept, read through `read`; the old single save moves into slot 1 when no slot has anything yet */
export function loadFrom(read: (key: SaveKey) => unknown): Loaded {
  const slots: Slots = [checkSlot(read("slot1")), checkSlot(read("slot2")), checkSlot(read("slot3"))];
  const firstRun = read("account") === null;
  let migrated = false;
  if (firstRun && slots.every((s) => s === null)) {
    const old = migrateMain(read("main"));
    if (old) { slots[0] = old; migrated = true; }
  }
  return { account: checkAccount(read("account")), slots, settings: checkSettings(read("settings")), migrated, firstRun };
}
