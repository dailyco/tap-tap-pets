import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BGM_FRAMES } from "../music";

test("the music is exactly one loop long, so it plays round without a seam (node bgm.mjs)", () => {
  const wav = readFileSync(join(import.meta.dir, "..", "media", "bgm", "loop.wav"));
  const rate = wav.readUInt32LE(24), bytes = wav.readUInt32LE(40), channels = wav.readUInt16LE(22), bits = wav.readUInt16LE(34);
  const seconds = bytes / (rate * channels * (bits / 8));
  expect(seconds * 60).toBeCloseTo(BGM_FRAMES, 6);
});
