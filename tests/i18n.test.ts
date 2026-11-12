import { expect, test } from "bun:test";
import { canDraw } from "../art";
import { STR, t } from "../i18n";
import { ITEMS } from "../items";

test("every string has both languages", () => {
  for (const [k, v] of Object.entries(STR)) {
    expect(v.ko.length, k).toBeGreaterThan(0);
    expect(v.en.length, k).toBeGreaterThan(0);
  }
});

test("english draws in the pixel font", () => {
  for (const [k, v] of Object.entries(STR)) for (const line of v.en.replace(/\{\w+\}/g, "0").split("\n")) expect(canDraw(line), `${k}: ${line}`).toBe(true);
});

test("the font knows the new glyphs and nothing it doesn't", () => {
  expect(canDraw("100% (A, B) CAN'T")).toBe(true);
  expect(canDraw("← →")).toBe(true);
  expect(canDraw("한국어")).toBe(false);
  expect(canDraw("×5")).toBe(false);
});

test("vars fill in", () => {
  expect(t("en", "needMore", { n: 23 })).toBe("NEED 23 MORE");
  expect(t("ko", "needMore", { n: 23 })).toBe("23 코인 부족");
});

test("fixed names from the spec", () => {
  expect(t("ko", "tool.upa.tap")).toBe("지느러미 박수");
  expect(t("en", "tool.mochi.sec")).toBe("TREASURE");
  expect(t("ko", "tool.mochi.sec")).toBe("보물");
  expect(t("en", "pet.mochi")).toBe("MOCHIRYU");
  expect(t("ko", "pet.mungge")).toBe("뭉게");
  expect(t("ko", "ability.cat")).toBe("탭 코인 +50%");
  expect(t("ko", "ability.upa")).toBe("1% 확률로 잭팟 ×5");
  expect(t("en", "ability.upa")).toBe("1% CHANCE: X5 JACKPOT");
  expect(t("ko", "ability.mochi")).toBe("모든 코인 +25%\n5% 확률로 잭팟 ×5");
  expect(t("en", "ability.mochi")).toBe("ALL COINS +25%\n5% X5 JACKPOT");
  expect(t("ko", "ability.mungge")).toBe("초당 코인 +25%");
  expect(t("ko", "pet.unknown")).toBe("???");
  expect(["cat", "upa", "mungge", "mochi"].map((p) => t("ko", `tool.${p}.speed` as never))).toEqual(["방울", "물레방아", "바람개비", "여의주"]);
  expect(["cat", "upa", "mungge", "mochi"].map((p) => t("en", `tool.${p}.speed` as never))).toEqual(["BELL", "WATER WHEEL", "PINWHEEL", "DRAGON PEARL"]);
  expect(t("ko", "title")).toBe("TAP TAP PETS");
  expect(t("en", "title")).toBe("TAP TAP PETS");
});

test("every item has a name in both languages", () => {
  expect(ITEMS.map((it) => t("ko", it.name))).toEqual(["리본", "선글라스", "야구모자", "목도리", "줄무늬 티", "영웅 망토", "왕관"]);
  expect(t("en", ITEMS[4].name)).toBe("STRIPE TEE");
});
