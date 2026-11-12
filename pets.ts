// The pets: what each costs in sunlight, what it's good at, and its own two tools (one for coins a second, one for
// coins a tap). Every number here is from the design (docs/superpowers/specs/2026-11-11-pets-sunlight-slots-design.md).
import type { Key } from "./i18n";
import type { PetId, SlotData } from "./state";

export interface ToolDef { kind: "sec" | "tap"; name: Key; icon: string; value(lv: number): number; cost(lv: number): number }
export interface PetDef {
  id: PetId;
  name: Key;
  ability: Key;
  /** sunlight to bring it home; 0: it's there from the start */
  price: number;
  tools: [ToolDef, ToolDef];
  /** how much more it earns, a second and a tap */
  mult: { sec: number; tap: number };
  /** the chance a tap is a x5 jackpot */
  jackpot: number;
}

/** Fibonacci numbers, 1, 1, 2, 3, 5, 8 ... (fib(1) = fib(2) = 1): each about 1.6 times the one before */
const fib = (n: number) => {
  let a = 0, b = 1;
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;
};
/** x2 at every tenth level (10, 20, 30 ...): the jump you can see coming in the shop */
const boost = (lv: number) => Math.pow(2, Math.floor(lv / 10));
/** a tool's price: x2 a level. The gain grows about x1.6 a level and doubles every ten, so a tenth level pays back fast,
 *  but ten levels together cost about 4 times what they earn more than the ten before: coins never run away (two hours of
 *  greedy play: some 50B a second) */
const price = (first: number) => (lv: number) => Math.round(first * Math.pow(2, lv));
/** coins a second: 1, 2, 4, 7, 12, 20, 33, 54, 88, 143, then 464 (x2) ... for 40, 80, 160, 320 ... coins */
const secTool = (pet: PetId): ToolDef => ({
  kind: "sec", name: `tool.${pet}.sec` as Key, icon: `tool-${pet}-sec`, value: (lv) => (fib(lv + 3) - 1) * boost(lv), cost: price(40),
});
/** coins a tap: twice a second's coins at the same level, so each level adds twice as much too, for half the price
 *  (tapping pays more than leaving it be): 2, 4, 8, 14, 24, 40, 66, 108, 176, 286, then 928 (x2) ... for 20, 40, 80,
 *  160 ... coins (two hours of greedy play at 10 taps a second stay under a trillion a second) */
const tapTool = (pet: PetId): ToolDef => ({
  kind: "tap", name: `tool.${pet}.tap` as Key, icon: `tool-${pet}-tap`, value: (lv) => 2 * (fib(lv + 3) - 1) * boost(lv), cost: price(20),
});
const pet = (id: PetId, price: number, mult: { sec: number; tap: number }, jackpot = 0): PetDef =>
  ({ id, name: `pet.${id}` as Key, ability: `ability.${id}` as Key, price, tools: [secTool(id), tapTool(id)], mult, jackpot });

export const PETS: PetDef[] = [
  pet("cat", 0, { sec: 1, tap: 1.5 }),
  pet("upa", 3, { sec: 1, tap: 1 }, 0.01),
  pet("mungge", 5, { sec: 1.25, tap: 1 }),
  pet("mochi", 8, { sec: 1.25, tap: 1.25 }, 0.05),
];
export const petOf = (id: PetId): PetDef => PETS.find((p) => p.id === id)!;

/** a number in [0, 1) made from n: the same n, the same number (the game's only randomness) */
export const hash = (n: number) => {
  let h = (n * 2654435761) >>> 0;
  h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
};

export const perSecond = (s: SlotData) => {
  const p = petOf(s.pet);
  return p.tools[0].value(s.tools[0]) * p.mult.sec;
};

/** a tap's coins without a jackpot (what the HUD shows) */
export const tapBase = (s: SlotData) => {
  const p = petOf(s.pet);
  return p.tools[1].value(s.tools[1]) * p.mult.tap;
};

/** a tap on `frame`: its coins, and whether it was a jackpot */
export function perTap(s: SlotData, frame: number): { coins: number; jackpot: boolean } {
  const p = petOf(s.pet);
  const base = tapBase(s);
  const jackpot = p.jackpot > 0 && hash(frame * 31 + 7) < p.jackpot;
  return { coins: jackpot ? base * 5 : base, jackpot };
}
