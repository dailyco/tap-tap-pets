// bun tools/scenery.ts: the scenery's pictures (media/bg/<phase>-sky.png, <phase>-land.png) drawn again from
// ui/scenery.ts. Run it after changing the scenery; tests/scenery.test.ts fails until the pictures match.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FH, FW } from "../layout";
import { PHASES, landRects, skyRects } from "../ui/scenery";
import { png, rasterize } from "./png";

const dir = join(import.meta.dir, "..", "media", "bg");
mkdirSync(dir, { recursive: true });
for (const p of PHASES) {
  for (const [part, rects] of [["sky", skyRects(p)], ["land", landRects(p)]] as const) {
    const file = join(dir, `${p}-${part}.png`);
    writeFileSync(file, png(rasterize(rects, FW, FH), FW, FH));
    console.log(file);
  }
}
