import { expect, test } from "bun:test";
import { savePathFrom } from "../save";

test("the save file: TAP_TAP_PETS_SAVE when it's set, else beside the user's app data", () => {
  expect(savePathFrom("/tmp/fresh.db", "/Users/a")).toBe("/tmp/fresh.db");
  expect(savePathFrom(null, "/Users/a")).toBe("/Users/a/Library/Application Support/pixel-pet-save.db");
  expect(savePathFrom("", "/Users/a")).toBe("/Users/a/Library/Application Support/pixel-pet-save.db");
  expect(savePathFrom(null, null)).toBe(null);
  expect(savePathFrom("/tmp/fresh.db", null)).toBe("/tmp/fresh.db");
});
