import { expect, test } from "bun:test";
import { ITEMS, itemOf } from "../items";

/** the closet from cheapest to dearest (the cape and the crown on top), each step at least twice the one before */
const CUTENESS = ["ribbon", "shades", "cap", "scarf", "tee", "cape", "crown"];

test("the cape and the crown are the dearest", () => {
  expect(CUTENESS.map((id) => itemOf(id)!.price)).toEqual([30, 80, 200, 500, 1200, 3000, 8000]);
  const prices = CUTENESS.map((id) => itemOf(id)!.price);
  for (let i = 1; i < prices.length; i++) expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1] * 2);
  expect(ITEMS.length).toBe(CUTENESS.length);
});

test("the closet lists the cheapest first, the dearest last", () => {
  expect(ITEMS.map((it) => it.id)).toEqual(["ribbon", "shades", "cap", "scarf", "tee", "cape", "crown"]);
  for (let i = 1; i < ITEMS.length; i++) expect(ITEMS[i].price).toBeGreaterThan(ITEMS[i - 1].price);
});
