// The closet's items: the same seven for every pet, each drawn to fit the pet that wears it (petArt.ts). The cape and
// the crown are the dearest: ribbon 30 < shades 80 < cap 200 < scarf 500 < tee 1,200 < cape 3,000 < crown 8,000.
import type { Key } from "./i18n";

export type Slot = "hat" | "body" | "acc";
export interface Item { id: string; name: Key; slot: Slot; price: number }

/** cheapest first: the closet lists them in this order (the cape and the crown are the dearest) */
export const ITEMS: Item[] = [
  { id: "ribbon", name: "item.ribbon", slot: "hat", price: 30 },
  { id: "shades", name: "item.shades", slot: "acc", price: 80 },
  { id: "cap", name: "item.cap", slot: "hat", price: 200 },
  { id: "scarf", name: "item.scarf", slot: "acc", price: 500 },
  { id: "tee", name: "item.tee", slot: "body", price: 1200 },
  { id: "cape", name: "item.cape", slot: "body", price: 3000 },
  { id: "crown", name: "item.crown", slot: "hat", price: 8000 },
];

export const itemOf = (id: string): Item | undefined => ITEMS.find((it) => it.id === id);
