// The sky at a moment of the day (a day is SUN_FRAMES of play): its six bands, the hills' colours, where the sun or
// the moon is, and how many stars are out. Pure: the same moment, the same sky.
import { SUN_FRAMES } from "../state";

export type Phase = "morning" | "day" | "sunset" | "night";
export interface Sky { phase: Phase; bands: string[]; hills: [string, string]; sun: { x: number; y: number } | null; moon: { x: number; y: number } | null; stars: number }

const LOOK: Record<Phase, { bands: string[]; hills: [string, string] }> = {
  morning: { bands: ["#5b6ee1", "#7a86e8", "#a99be8", "#d9a6d9", "#f7b7b0", "#ffd2a0"], hills: ["#7a6aa8", "#5a4f88"] },
  day: { bands: ["#3a8fe0", "#4aa3ec", "#62b6f2", "#7fc8f6", "#9fd8f8", "#c2e8fa"], hills: ["#5aa06e", "#3f8052"] },
  sunset: { bands: ["#2f1d5c", "#542c7f", "#8a3a8a", "#c94f7c", "#f2765c", "#ffb35c"], hills: ["#3b2566", "#2a1a4a"] },
  night: { bands: ["#0e0a24", "#150f33", "#1a1033", "#24164a", "#2f1d5c", "#3d2470"], hills: ["#1f1640", "#160f30"] },
};

/** the sun is up for the first 70% of the day, the moon for the rest; each crosses the sky on an arc */
export function skyAt(sunFrames: number): Sky {
  const k = (((sunFrames % SUN_FRAMES) + SUN_FRAMES) % SUN_FRAMES) / SUN_FRAMES;
  const phase: Phase = k < 0.2 ? "morning" : k < 0.5 ? "day" : k < 0.7 ? "sunset" : "night";
  const arc = (t: number, low: number, high: number) => ({ x: Math.round(120 + t * 1360), y: Math.round(low - Math.sin(t * Math.PI) * high) });
  return {
    phase,
    ...LOOK[phase],
    sun: k < 0.7 ? arc(k / 0.7, 640, 560) : null,
    moon: k >= 0.7 ? arc((k - 0.7) / 0.3, 600, 480) : null,
    stars: k >= 0.7 ? 26 : k >= 0.62 ? 10 : k < 0.04 ? 6 : 0,
  };
}
