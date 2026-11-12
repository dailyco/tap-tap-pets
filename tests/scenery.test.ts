import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FH, FW, GROUND } from "../layout";
import { LOOK } from "../ui/skyAt";
import { PHASES, landRects, skyRects } from "../ui/scenery";
import { png, rasterize } from "../tools/png";

const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), 255];
const at = (px: Uint8Array, x: number, y: number) => [...px.slice((y * FW + x) * 4, (y * FW + x) * 4 + 4)];

test("the sky: six bands, dithered where they meet; the land: hills by phase, then the ground", () => {
  for (const p of PHASES) {
    const sky = rasterize(skyRects(p), FW, FH);
    expect(at(sky, 0, 0)).toEqual(hex(LOOK[p].bands[0]));
    expect(at(sky, FW - 1, GROUND - 1)).toEqual(hex(LOOK[p].bands[5]));
    const land = rasterize(landRects(p), FW, FH);
    expect(at(land, 0, 0)).toEqual([0, 0, 0, 0]);
    expect(at(land, 8, GROUND - 1)).toEqual(hex(LOOK[p].hills[1]));
    expect(at(land, 0, FH - 1)).toEqual(hex("#4a2c17"));
  }
});

test("the pictures in media/bg are the scenery as drawn now (run: bun tools/scenery.ts)", () => {
  for (const p of PHASES) {
    for (const [part, rects] of [["sky", skyRects(p)], ["land", landRects(p)]] as const) {
      const file = readFileSync(join(import.meta.dir, "..", "media", "bg", `${p}-${part}.png`));
      expect(Buffer.from(png(rasterize(rects, FW, FH), FW, FH)).equals(file), `${p}-${part}.png`).toBe(true);
    }
  }
});
