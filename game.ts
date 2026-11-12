// The idle game as a pure fold. The home screen holds three save slots (a pet's run each), the pets you can bring home
// with sunlight, and the settings. In play: coins every second, more for each tap, the pet's own tools in the SHOP,
// clothes tried on before they're bought in the CLOSET. step(state, input, frame) returns a new state; nothing here
// mutates. What's on disk is read once before play and only taken in on the first live frame, so a render never
// depends on it; writes happen in the view, when a counter here (saveN, accN, setN, delN) moves.
import type { FrameInput, Playtest } from "raea";
import { ITEMS, itemOf } from "./items";
import {
  ASK_HOME, ASK_STAY, BUY_BAR, CLOSET_BTN, CONTINUE_BTN, DEL_CANCEL, DEL_OK, DEL_PANEL, GEAR_HOME, GEAR_PLAY, LANG_EN, LANG_KO, LANG_ROW, NEW_BTN,
  PET_BOX, PET_BUY, PET_CARDS, PET_CENTER, PETS_BTN, PETS_PANEL, SAVE_BTN, SET_PANEL, SET_ROW, SHOP_BTN, SLOT_CARDS, SLOT_DELETE,
  SLOTS_PANEL, SOUND_ROW, WALK, inside, panelBox, petBoxAt, rowBox, toField, type Box,
} from "./layout";
import { hash, perSecond, perTap, petOf, PETS } from "./pets";
import { readAll } from "./save";
import {
  DEFAULT_SETTINGS, FRESH_ACCOUNT, PET_IDS, SUN_FRAMES, freshSlot,
  type Account, type Lang, type Loaded, type PetId, type Settings, type SlotData, type Slots, type Wear,
} from "./state";

// ---- the state ----
export interface Pop { x: number; y: number; n: number; t: number; idle: boolean; big?: boolean }
export interface Chip { x: number; y: number; vx: number; vy: number; t: number }
/** the home screen: its two buttons ("main"), the slots opened to continue or to start new, the PETS panel, picking a
 *  new slot's pet, and asking before a slot is deleted or started over */
export type HomeView = "main" | "continue" | "new" | "pets" | "pick" | "delete" | "overwrite";
export interface Game {
  phase: "home" | "play";
  slots: Slots;
  /** the slot being played, and its run (copied back into `slots` on the way home) */
  cur: number | null;
  p: SlotData;
  acc: Account;
  set: Settings;
  /** what was on disk, waiting for the first live frame */
  pending: Loaded | null;
  /** the old single save was moved into slot 1 (the view writes slot 1 once) */
  migrated: boolean;
  homeView: HomeView;
  /** which slots box the pick, delete and start-over questions go back to */
  slotMode: "continue" | "new";
  /** the slot a pick or a delete is about */
  target: number | null;
  /** a pet just brought home, shown off */
  reveal: { pet: PetId; t: number } | null;
  /** the pet standing on the home screen: the last one played */
  lastPet: PetId;
  // writes: bumped when the slot being played (saveN), the account (accN), the settings (setN) should be written, or
  // a slot deleted (delN, delSlot); saveT is when the last slot save was asked for (the SAVED note)
  saveN: number; saveT: number; accN: number; setN: number; delN: number; delSlot: number | null;
  panel: "shop" | "closet" | null;
  /** the closet item being tried on (not owned yet) */
  pick: string | null;
  /** after a save: asking whether to go home */
  ask: boolean;
  settings: boolean;
  /** the pointer was down last frame, and the keys held last frame: a press is a change */
  down: boolean;
  keys: string[];
  tapT: number;
  pops: Pop[];
  chips: Chip[];
  /** the last row pressed in a panel, whether it went through, and when */
  note: { panel: "shop" | "closet" | "pets"; row: number; ok: boolean; t: number } | null;
  /** the frame every item became owned; the SAVE button was pressed; sound came back on; the last sunlight came */
  doneT: number; manualT: number; soundT: number; sunT: number;
  // counters, so sounds cue on a change
  taps: number; buys: number; fails: number; equips: number; tries: number; payouts: number; ups: number;
  opens: number; closes: number; starts: number; saves: number; toggles: number; suns: number; adopts: number;
  deletes: number; jackpots: number;
  /** where the pet stands on the play screen, which way it faces, and whether it walked this frame */
  petX: number; facing: "left" | "right"; walking: boolean;
  /** a person has played (a live frame, a key or a pointer): the demo stops for good */
  human: boolean;
  /** where the pointer is, in field units (null before it has been anywhere) */
  cursor: { x: number; y: number; down: boolean } | null;
}

export function makeInitial(loaded: Loaded | null): Game {
  return {
    phase: "home", slots: [null, null, null], cur: null, p: freshSlot("cat"), acc: FRESH_ACCOUNT, set: DEFAULT_SETTINGS,
    pending: loaded, migrated: false, homeView: "main", slotMode: "continue", target: null, reveal: null, lastPet: "cat",
    saveN: 0, saveT: -999, accN: 0, setN: 0, delN: 0, delSlot: null,
    panel: null, pick: null, ask: false, settings: false, down: false, keys: [], tapT: -999, pops: [], chips: [], note: null,
    doneT: -1, manualT: -999, soundT: 0, sunT: -999,
    taps: 0, buys: 0, fails: 0, equips: 0, tries: 0, payouts: 0, ups: 0, opens: 0, closes: 0, starts: 0, saves: 0, toggles: 0,
    suns: 0, adopts: 0, deletes: 0, jackpots: 0, human: false, cursor: null, petX: PET_CENTER.x, facing: "right", walking: false,
  };
}
export const INITIAL: Game = makeInitial(readAll());

// ---- what the screens show ----
/** a pet's card in the PETS panel: an unowned pet keeps its name hidden */
export function petCard(acc: Account, pet: PetId) {
  const def = petOf(pet), owned = acc.pets.includes(pet);
  return { name: owned ? def.name : ("pet.unknown" as const), owned, price: def.price, canBuy: !owned && acc.sun >= def.price };
}
export function slotSummary(s: SlotData | null) {
  return s ? { pet: s.pet, coins: s.coins, style: s.owned.length, minutes: Math.floor(s.playFrames / 3600) } : null;
}
/** what the pet shows: what it wears, with the item being tried on in its slot */
export const shownWear = (g: Game): Wear => {
  const it = g.pick ? itemOf(g.pick) : undefined;
  return it ? { ...g.p.wear, [it.slot]: it.id } : g.p.wear;
};
export const pickedItem = (g: Game) => (g.pick ? itemOf(g.pick) ?? null : null);
/** a tool can be bought, or a closet item, right now */
export const canUpgrade = (p: SlotData) => petOf(p.pet).tools.some((t, i) => p.coins >= t.cost(p.tools[i]));
export const canDress = (p: SlotData) => ITEMS.some((it) => !p.owned.includes(it.id) && p.coins >= it.price);

// ---- the demo a render plays when nobody is at the controls ----
interface Click { at: number; x: number; y: number }
const DEMO: Click[] = [];
const taps = (from: number, to: number, every: number) => {
  for (let f = from; f < to; f += every) DEMO.push({ at: f, x: 800 + ((f * 37) % 90) - 45, y: 560 + ((f * 53) % 80) - 40 });
};
const at = (f: number, b: Box) => DEMO.push({ at: f, x: b.x + b.w / 2, y: b.y + b.h / 2 });
at(40, NEW_BTN); at(90, SLOT_CARDS[0]); at(140, PET_BUY[0]);
taps(170, 470, 10);
at(520, SHOP_BTN); at(580, rowBox(0)); at(640, rowBox(1)); at(700, SHOP_BTN);
taps(750, 1000, 9);
at(1050, CLOSET_BTN); at(1110, rowBox(1)); at(1180, rowBox(0)); at(1250, BUY_BAR); at(1320, rowBox(1)); at(1390, BUY_BAR); at(1460, CLOSET_BTN);
taps(1510, 1800, 9);
at(1850, CLOSET_BTN); at(1910, rowBox(2)); at(1980, BUY_BAR); at(2050, CLOSET_BTN);
at(2085, SAVE_BTN); at(2150, ASK_HOME); at(2200, PETS_BTN); at(2330, { x: 30, y: 870, w: 20, h: 20 }); at(2380, CONTINUE_BTN); at(2430, SLOT_CARDS[0]);
taps(2490, 2750, 9);
DEMO.sort((a, b) => a.at - b.at);
const HOLD = 4;

/** the demo's pointer at this frame: gliding toward the next click, down for a few frames on it */
export function demoPointer(frame: number): { x: number; y: number; down: boolean } {
  let i = 0;
  while (i < DEMO.length && DEMO[i].at + HOLD <= frame) i++;
  const next = DEMO[Math.min(i, DEMO.length - 1)];
  const prev = i > 0 ? DEMO[i - 1] : { at: 0, x: 800, y: 420 };
  if (frame >= next.at) return { x: next.x, y: next.y, down: frame < next.at + HOLD };
  const span = Math.max(1, next.at - (prev.at + HOLD));
  const t = Math.min(1, Math.max(0, (frame - (prev.at + HOLD)) / Math.min(span, 26)));
  const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  return { x: prev.x + (next.x - prev.x) * e, y: prev.y + (next.y - prev.y) * e, down: false };
}

// ---- the step ----
type Action =
  | { kind: "settings" } | { kind: "closeSettings" } | { kind: "toggleAuto" } | { kind: "toggleSound" } | { kind: "setLang"; lang: Lang }
  // home
  | { kind: "openSlots"; mode: "continue" | "new" } | { kind: "slot"; slot: number } | { kind: "askDelete"; slot: number }
  | { kind: "confirm" } | { kind: "openPets" }
  | { kind: "petCard"; pet: number } | { kind: "closeModal" } | { kind: "dismissReveal" }
  // play
  | { kind: "tap"; x: number; y: number } | { kind: "panel"; panel: "shop" | "closet" } | { kind: "home" } | { kind: "row"; row: number }
  | { kind: "buy" } | { kind: "save" } | { kind: "stay" } | { kind: "dismiss" };

function hit(s: Game, x: number, y: number): Action | null {
  if (s.settings) {
    if (inside(SET_ROW, x, y)) return { kind: "toggleAuto" };
    if (inside(SOUND_ROW, x, y)) return { kind: "toggleSound" };
    if (inside(LANG_KO, x, y)) return { kind: "setLang", lang: "ko" };
    if (inside(LANG_EN, x, y)) return { kind: "setLang", lang: "en" };
    if (inside(LANG_ROW, x, y)) return null;
    if (inside(SET_PANEL, x, y)) return null;
    return { kind: "closeSettings" };
  }
  if (s.phase === "home") {
    if (s.reveal) return { kind: "dismissReveal" };
    if (s.homeView === "delete" || s.homeView === "overwrite") {
      if (inside(DEL_OK, x, y)) return { kind: "confirm" };
      if (inside(DEL_CANCEL, x, y)) return { kind: "closeModal" };
      return inside(DEL_PANEL, x, y) ? null : { kind: "closeModal" };
    }
    if (s.homeView === "pets" || s.homeView === "pick") {
      for (let i = 0; i < PET_CARDS.length; i++) if (inside(PET_BUY[i], x, y) || inside(PET_CARDS[i], x, y)) return { kind: "petCard", pet: i };
      return inside(PETS_PANEL, x, y) ? null : { kind: "closeModal" };
    }
    if (s.homeView === "continue" || s.homeView === "new") {
      for (let i = 0; i < 3; i++) {
        if (s.slots[i] && inside(SLOT_DELETE[i], x, y)) return { kind: "askDelete", slot: i };
        if (inside(SLOT_CARDS[i], x, y)) return { kind: "slot", slot: i };
      }
      return inside(SLOTS_PANEL, x, y) ? null : { kind: "closeModal" };
    }
    if (inside(GEAR_HOME, x, y)) return { kind: "settings" };
    if (inside(PETS_BTN, x, y)) return { kind: "openPets" };
    if (inside(CONTINUE_BTN, x, y)) return { kind: "openSlots", mode: "continue" };
    if (inside(NEW_BTN, x, y)) return { kind: "openSlots", mode: "new" };
    return null;
  }
  if (s.ask) {
    if (inside(ASK_HOME, x, y)) return { kind: "home" };
    if (inside(ASK_STAY, x, y)) return { kind: "stay" };
    return null;
  }
  if (inside(SAVE_BTN, x, y)) return { kind: "save" };
  if (inside(GEAR_PLAY, x, y)) return { kind: "settings" };
  if (inside(SHOP_BTN, x, y)) return { kind: "panel", panel: "shop" };
  if (inside(CLOSET_BTN, x, y)) return { kind: "panel", panel: "closet" };
  if (s.panel) {
    const rows = s.panel === "shop" ? 2 : ITEMS.length;
    for (let i = 0; i < rows; i++) if (inside(rowBox(i), x, y)) return { kind: "row", row: i };
    if (s.panel === "closet" && inside(BUY_BAR, x, y)) return { kind: "buy" };
    if (inside(panelBox(s.panel), x, y)) return null;
    // a click anywhere else closes the open panel, and does nothing else
    return { kind: "dismiss" };
  }
  if (inside(petBoxAt(s.petX), x, y)) return { kind: "tap", x, y };
  return null;
}

interface Ctx { now: number; pressed: (k: string) => boolean; held: (k: string) => boolean; save: () => void; auto: () => void }

export function step(s0: Game, input: FrameInput, frame: number): Game {
  const live = !!(input as FrameInput & { live?: boolean }).live;
  // what's on disk joins the state on the first frame someone plays
  const d = live ? s0.pending : null;
  const s: Game = d
    ? { ...s0, pending: null, slots: d.slots, acc: d.account, set: d.settings, migrated: d.migrated, lastPet: d.slots.find((x) => x)?.pet ?? "cat",
        // a first run writes the account at once, so the old save is never moved into slot 1 again
        accN: s0.accN + (d.firstRun ? 1 : 0) }
    : s0;
  const human = s.human || live || input.keys.length > 0 || !!input.pointer;
  let ptr: { x: number; y: number; down: boolean } | null = null;
  if (input.pointer) ptr = { ...toField(input.pointer), down: input.pointer.down };
  else if (!human) ptr = demoPointer(frame);
  const keys = human ? input.keys : [];
  const pressed = (k: string) => keys.includes(k) && !s.keys.includes(k);
  const clicked = !!ptr && ptr.down && !s.down;
  const now = frame + 1;

  const g: Game = { ...s, human, down: !!ptr?.down, keys: [...keys], cursor: ptr ?? s.cursor };
  let action: Action | null = clicked && ptr ? hit(g, ptr.x, ptr.y) : null;
  const save = () => { g.saveN += 1; g.saveT = now; };
  /** a save the game makes by itself: only while auto save is on */
  const auto = () => { if (g.set.autosave) save(); };

  // the settings box (on either screen) takes the clicks and Escape while it's up
  let busy = g.settings;
  if (g.settings && pressed("Escape")) action = { kind: "closeSettings" };
  if (action?.kind === "settings") {
    Object.assign(g, { settings: true, panel: null, pick: null, opens: g.opens + 1 }); busy = true; action = null;
  } else if (action?.kind === "closeSettings") {
    Object.assign(g, { settings: false, closes: g.closes + 1 }); busy = true; action = null;
  } else if (action?.kind === "toggleAuto" || action?.kind === "toggleSound" || action?.kind === "setLang") {
    const set = { ...g.set };
    if (action.kind === "toggleAuto") set.autosave = !set.autosave;
    if (action.kind === "toggleSound") { set.sound = !set.sound; g.soundT = now; }
    if (action.kind === "setLang") set.lang = action.lang;
    // picking the language already picked changes nothing (and writes nothing)
    if (set.autosave !== g.set.autosave || set.sound !== g.set.sound || set.lang !== g.set.lang) {
      Object.assign(g, { set, setN: g.setN + 1, toggles: g.toggles + 1 });
    }
    busy = true; action = null;
  }

  const ctx: Ctx = { now, pressed, held: (k: string) => keys.includes(k), save, auto };
  const out = g.phase === "home" ? homeStep(g, busy ? null : action, busy, ctx) : playStep(g, busy ? null : action, busy, ctx);
  // let go of what has finished drawing
  if (out.pops.length && now - out.pops[0].t > 70) out.pops = out.pops.filter((q) => now - q.t <= 70);
  if (out.chips.length && now - out.chips[0].t > 50) out.chips = out.chips.filter((c) => now - c.t <= 50);
  return out;
}

function homeStep(g: Game, action: Action | null, busy: boolean, { now, pressed, save }: Ctx): Game {
  if (g.reveal && now - g.reveal.t > 300) g.reveal = null;
  const any = g.slots.some((x) => x);
  if (!busy && !g.reveal) {
    const v = g.homeView;
    if (v === "main") {
      if (pressed("Enter")) action = { kind: "openSlots", mode: any ? "continue" : "new" };
      if (pressed("n") || pressed("N")) action = { kind: "openSlots", mode: "new" };
      if (pressed("p") || pressed("P")) action = { kind: "openPets" };
    } else if (pressed("Escape")) action = { kind: "closeModal" };
    else if (v === "continue" || v === "new") { for (let i = 0; i < 3; i++) if (pressed(String(i + 1))) action = { kind: "slot", slot: i }; }
    else if (v === "pets" || v === "pick") { for (let i = 0; i < PETS.length; i++) if (pressed(String(i + 1))) action = { kind: "petCard", pet: i }; }
    else if (pressed("Enter")) action = { kind: "confirm" };
  }
  if (!action) return g;
  const back = (): HomeView => (g.homeView === "pick" || g.homeView === "delete" || g.homeView === "overwrite" ? g.slotMode : "main");
  switch (action.kind) {
    case "dismissReveal":
      if (g.reveal && now - g.reveal.t > 30) g.reveal = null;
      break;
    case "openSlots":
      if (action.mode === "continue" && !any) { g.fails += 1; break; }
      Object.assign(g, { homeView: action.mode, slotMode: action.mode, target: null, opens: g.opens + 1 });
      break;
    case "slot": {
      const slot = g.slots[action.slot];
      if (slot && g.homeView === "continue") {
        Object.assign(g, { phase: "play", cur: action.slot, p: slot, lastPet: slot.pet, starts: g.starts + 1, pops: [], chips: [], note: null, tapT: -999, homeView: "main", petX: PET_CENTER.x, facing: "right", walking: false });
      } else if (slot) {
        Object.assign(g, { homeView: "overwrite", target: action.slot, opens: g.opens + 1 });
      } else {
        Object.assign(g, { homeView: "pick", target: action.slot, opens: g.opens + 1 });
      }
      break;
    }
    case "openPets":
      Object.assign(g, { homeView: "pets", target: null, opens: g.opens + 1 });
      break;
    case "closeModal":
      Object.assign(g, { homeView: back(), target: null, closes: g.closes + 1 });
      break;
    case "askDelete":
      Object.assign(g, { homeView: "delete", target: action.slot, opens: g.opens + 1 });
      break;
    case "confirm": {
      const i = g.target;
      if (i === null) break;
      if (g.homeView === "overwrite") { g.homeView = "pick"; break; }
      const slots = [...g.slots] as Slots;
      slots[i] = null;
      Object.assign(g, { slots, delN: g.delN + 1, delSlot: i, deletes: g.deletes + 1, homeView: g.slotMode, target: null, cur: g.cur === i ? null : g.cur });
      break;
    }
    case "petCard": {
      const pet = PETS[action.pet];
      const card = petCard(g.acc, pet.id);
      if (g.homeView === "pick" && g.target !== null) {
        if (!card.owned) { g.fails += 1; g.note = { panel: "pets", row: action.pet, ok: false, t: now }; break; }
        const slots = [...g.slots] as Slots;
        const fresh = freshSlot(pet.id);
        slots[g.target] = fresh;
        Object.assign(g, {
          slots, cur: g.target, p: fresh, phase: "play", homeView: "main", target: null, lastPet: pet.id, starts: g.starts + 1,
          doneT: -1, tapT: -999, pops: [], chips: [], note: null, petX: PET_CENTER.x, facing: "right", walking: false,
        });
        save();
      } else if (g.homeView === "pets" && !card.owned) {
        if (!card.canBuy) { g.fails += 1; g.note = { panel: "pets", row: action.pet, ok: false, t: now }; break; }
        g.acc = { ...g.acc, sun: g.acc.sun - pet.price, pets: PET_IDS.filter((id) => id === pet.id || g.acc.pets.includes(id)) };
        Object.assign(g, { accN: g.accN + 1, reveal: { pet: pet.id, t: now }, adopts: g.adopts + 1, note: { panel: "pets", row: action.pet, ok: true, t: now } });
      }
      break;
    }
  }
  return g;
}

function playStep(g: Game, action: Action | null, busy: boolean, { now, pressed, held, save, auto }: Ctx): Game {
  const p: SlotData = { ...g.p, playFrames: g.p.playFrames + 1 };
  // the day goes on while the play screen is up, touched or not: a sunlight every SUN_FRAMES, kept the moment it comes
  let acc = { ...g.acc, sunFrames: g.acc.sunFrames + 1 };
  if (acc.sunFrames >= SUN_FRAMES) {
    acc = { ...acc, sun: acc.sun + 1, sunFrames: acc.sunFrames - SUN_FRAMES };
    Object.assign(g, { sunT: now, suns: g.suns + 1, accN: g.accN + 1 });
  }
  g.acc = acc;
  // a second's coins; every ten seconds the slot saves (if auto save is on) and the day's time always does
  if (now % 60 === 0) {
    const r = perSecond(p);
    p.coins += r; p.earned += r; g.payouts += 1;
    g.pops = [...g.pops, { x: g.petX - 250, y: PET_BOX.y + 10, n: r, t: now, idle: true }];
  }
  if (now % 600 === 0) { auto(); g.accN += 1; }

  // left and right (arrows or A and D) walk the pet, unless a box is asking something
  const dir = busy || g.ask ? 0 : (held("ArrowRight") || held("d") || held("D") ? 1 : 0) - (held("ArrowLeft") || held("a") || held("A") ? 1 : 0);
  if (dir) Object.assign(g, { petX: Math.min(WALK.max, Math.max(WALK.min, g.petX + dir * WALK.speed)), facing: dir < 0 ? "left" : "right", walking: true });
  else g.walking = false;

  if (!busy) {
    if (pressed(" ")) action = { kind: "tap", x: g.petX, y: PET_CENTER.y - 40 };
    if (pressed("s") || pressed("S")) action = { kind: "panel", panel: "shop" };
    if (pressed("c") || pressed("C")) action = { kind: "panel", panel: "closet" };
    if (pressed("h") || pressed("H")) action = { kind: "save" };
    if (g.ask) {
      // the question takes the keys while it's up: Enter (or h again) goes home, Escape stays
      if (pressed("Enter") || pressed("h") || pressed("H")) action = { kind: "home" };
      else if (pressed("Escape")) action = { kind: "stay" };
      else if (action && action.kind !== "home" && action.kind !== "stay") action = null;
    } else if (g.panel) for (let i = 1; i <= ITEMS.length; i++) if (pressed(String(i))) action = { kind: "row", row: i - 1 };
    if (g.panel === "closet" && (pressed("Enter") || pressed("b") || pressed("B"))) action = { kind: "buy" };
  }

  const def = petOf(p.pet);
  switch (action?.kind) {
    case "tap": {
      const { coins, jackpot } = perTap(p, now);
      p.coins += coins; p.earned += coins; g.taps += 1; g.tapT = now;
      if (jackpot) g.jackpots += 1;
      g.pops = [...g.pops, { x: g.petX + (hash(now * 3) - 0.5) * 220, y: PET_BOX.y - 40, n: coins, t: now, idle: false, big: jackpot }];
      const chips: Chip[] = [];
      for (let i = 0; i < 3; i++) chips.push({ x: action.x, y: action.y, vx: (hash(now * 7 + i) - 0.5) * 14, vy: -9 - hash(now * 13 + i) * 7, t: now });
      g.chips = [...g.chips, ...chips];
      break;
    }
    case "panel":
      if (g.panel === action.panel) { g.panel = null; g.closes += 1; } else { g.panel = action.panel; g.opens += 1; }
      g.pick = null;
      break;
    case "save":
      Object.assign(g, { manualT: now, saves: g.saves + 1, ask: true, panel: null, pick: null });
      save();
      break;
    case "dismiss":
      Object.assign(g, { panel: null, pick: null, closes: g.closes + 1 });
      break;
    case "stay":
      Object.assign(g, { ask: false, closes: g.closes + 1 });
      break;
    case "home": {
      const slots = [...g.slots] as Slots;
      if (g.cur !== null) slots[g.cur] = p;
      Object.assign(g, { slots, phase: "home", homeView: "main", ask: false, panel: null, pick: null, lastPet: p.pet, closes: g.closes + 1, accN: g.accN + 1 });
      save();
      break;
    }
    case "row":
      if (g.panel === "shop" && action.row < 2) {
        const tool = def.tools[action.row];
        const cost = tool.cost(p.tools[action.row]);
        if (p.coins >= cost) {
          p.coins -= cost;
          p.tools = action.row === 0 ? [p.tools[0] + 1, p.tools[1]] : [p.tools[0], p.tools[1] + 1];
          g.ups += 1; g.note = { panel: "shop", row: action.row, ok: true, t: now }; auto();
        } else {
          g.fails += 1; g.note = { panel: "shop", row: action.row, ok: false, t: now };
        }
      } else if (g.panel === "closet" && action.row < ITEMS.length) {
        const item = ITEMS[action.row];
        if (p.owned.includes(item.id)) {
          p.wear = { ...p.wear, [item.slot]: p.wear[item.slot] === item.id ? null : item.id };
          g.pick = null; g.equips += 1; g.note = { panel: "closet", row: action.row, ok: true, t: now }; auto();
        } else {
          g.pick = g.pick === item.id ? null : item.id; g.tries += 1;
        }
      }
      break;
    case "buy": {
      const item = g.panel === "closet" && g.pick ? itemOf(g.pick) : undefined;
      if (!item) break;
      if (p.coins >= item.price) {
        p.coins -= item.price; p.owned = [...p.owned, item.id]; p.wear = { ...p.wear, [item.slot]: item.id };
        g.pick = null; g.buys += 1; g.note = { panel: "closet", row: ITEMS.length, ok: true, t: now }; auto();
        if (p.owned.length === ITEMS.length) g.doneT = now;
      } else {
        g.fails += 1; g.note = { panel: "closet", row: ITEMS.length, ok: false, t: now };
      }
      break;
    }
  }
  g.p = p;
  return g;
}

// ---- the playtest: a bot picks slot 1, taps with space, opens the panels with s and c, picks with digits ----
export const playtest: Playtest<Game> = {
  initial: INITIAL,
  step,
  actions: [[], [" "], ["ArrowLeft"], ["ArrowRight"], ["1"], ["Enter"], ["n"], ["s"], ["c"], ["2"], ["3"], ["4"], ["5"], ["6"], ["7"], ["b"], ["h"], ["p"], ["Escape"]],
  observe: (s) => ({ phase: s.phase, pet: s.p.pet, coins: s.p.coins, sun: s.acc.sun, tools: s.p.tools, owned: s.p.owned, panel: s.panel, pick: s.pick }),
  progress: (s) => s.p.owned.length / ITEMS.length,
  outcome: (s) => (s.p.owned.length === ITEMS.length ? "won" : null),
  events: {
    tap: (a, b) => b.taps > a.taps,
    buy: (a, b) => b.buys > a.buys,
    upgrade: (a, b) => b.ups > a.ups,
    fail: (a, b) => b.fails > a.fails,
  },
};
