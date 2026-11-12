// The pet on the field: breathing, squashing when tapped, blinking, wearing what it wears (and what it's trying on).
import { memo } from "react";
import type { Rect } from "../art";
import { pickedItem, shownWear, type Game } from "../game";
import { t } from "../i18n";
import { GROUND, PET_CENTER } from "../layout";
import { PET_W, petRects, type Eyes, type Pose } from "../petArt";
import type { PetId, Wear } from "../state";
import { C } from "../art";
import { Label, Pixels, onTwos, rect } from "./pixels";

export const PX = 9;
/** the canvas's row 43 (just under the feet' outline) stands on the grass */
const PET_TOP = GROUND + 6 - 43 * PX;
const BREATH: Pose[] = ["mid", "up", "mid", "down"];
const NONE: Wear = { hat: null, body: null, acc: null };

export function Pet({ g, frame }: { g: Game; frame: number }) {
  const play = g.phase === "play";
  const pet = play ? g.p.pet : g.lastPet;
  const wear = play ? shownWear(g) : (g.cur !== null ? g.slots[g.cur]?.wear : null) ?? NONE;
  // the tap's squash and hop on even frames (onTwos)
  const age = play ? onTwos(frame) - g.tapT : -1;
  const walk = play && g.walking ? Math.floor(frame / 6) % 2 : -1;
  const pose: Pose = age >= 0 && age < 5 ? "squash" : age >= 5 && age < 10 ? "up" : walk >= 0 ? (walk ? "up" : "down") : BREATH[Math.floor(frame / 24) % 4];
  const eyes: Eyes = age >= 0 && age < 26 ? "happy" : frame % 200 < 6 ? "blink" : "open";
  const hop = age >= 5 && age < 12 ? [-8, -16, -20, -20, -16, -8, -2][age - 5] : walk === 1 ? -8 : 0;
  const trying = play ? pickedItem(g) : null;
  return (
    <PetView pet={pet} pose={pose} eyes={eyes} hat={wear.hat} body={wear.body} acc={wear.acc} cx={play ? g.petX : PET_CENTER.x} hop={hop}
      flip={play && g.facing === "left"} trying={trying ? t(g.set.lang, "tryingOn", { name: t(g.set.lang, trying.name) }) : null}
      twinkle={trying ? Math.floor(frame / 10) % 2 : 0} />
  );
}

/** the shadow under the pet, wider as it squashes */
const shadowCache = new Map<Pose, Rect[]>();
function shadowOf(pose: Pose): Rect[] {
  let r = shadowCache.get(pose);
  if (r) return r;
  const wide = pose === "squash" ? 1.12 : pose === "down" ? 1.04 : pose === "up" ? 0.96 : 1;
  r = ([[-130, 0, 260], [-110, -8, 220], [-110, 8, 220]] as const).map(([x, y, w]) => rect(Math.round(x * wide) + 140, y + 8, Math.round(w * wide), 8, "#000"));
  shadowCache.set(pose, r);
  return r;
}
const SPARKLE: Rect[] = [rect(4, 0, 4, 12, C.goldLight), rect(0, 4, 12, 4, C.goldLight)];

/** the pet as it looks: drawn again only when the look changes (most frames it's the frame before's) */
const PetView = memo(function PetView({ pet, pose, eyes, hat, body, acc, cx, hop, flip, trying, twinkle }: {
  pet: PetId; pose: Pose; eyes: Eyes; hat: string | null; body: string | null; acc: string | null; cx: number; hop: number; flip: boolean; trying: string | null; twinkle: number;
}) {
  return (
    <>
      <Pixels rects={shadowOf(pose)} px={1} x={cx - 140} y={GROUND - 10} opacity={0.3} />
      <Pixels rects={petRects(pet, pose, eyes, { hat, body, acc })} px={PX} x={cx - (PET_W * PX) / 2} y={PET_TOP + hop} w={PET_W} h={44} flip={flip} />
      {trying ? (
        <>
          <Label s={trying} px={3} x={cx} y={318} color={C.gold} align="center" />
          {[[cx - 190, 460], [cx + 160, 520], [cx - 160, 640], [cx + 190, 400]].map(([x, y], i) => ((i + twinkle) % 2 ? (
            <Pixels key={i} rects={SPARKLE} px={1} x={x} y={y} />
          ) : null))}
        </>
      ) : null}
    </>
  );
});
