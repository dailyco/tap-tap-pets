// Plays the game from a script, as a person would live: clicks (held 4 frames) and keys (pressed for one frame).
import type { FrameInput } from "raea";
import { step, type Game } from "../game";
import { OX, OY, SCALE, type Box } from "../layout";

/** click: pressed for 4 frames; keys: pressed for this one frame; hold: held from this frame on (hold: [] lets go) */
export interface Cue { click?: Box | { x: number; y: number } | [number, number]; keys?: string[]; hold?: string[] }

/** `frames` frames from frame `from`, live, with the cues at their frames; the pointer rests where it last clicked */
export function drive(g: Game, script: Record<number, Cue>, frames: number, from = 0): Game {
  let cur = g;
  let pos: [number, number] = [8, 890];
  let downUntil = -1;
  let held: string[] = [];
  for (let f = from; f < from + frames; f++) {
    const c = script[f];
    if (c?.hold) held = c.hold;
    if (c?.click) {
      const b = c.click;
      pos = Array.isArray(b) ? b : "w" in b ? [b.x + b.w / 2, b.y + b.h / 2] : [b.x, b.y];
      downUntil = f + 4;
    }
    const input = { keys: [...held, ...(c?.keys ?? [])], live: true, pointer: { x: OX + pos[0] * SCALE, y: OY + pos[1] * SCALE, down: f < downUntil } };
    cur = step(cur, input as FrameInput, f);
  }
  return cur;
}
