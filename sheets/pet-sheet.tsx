// A check sheet: every pet in every pose, three outfits, and its silhouette. Not used by the game.
import { AbsoluteFill, Composition, registerRoot } from "raea";
import type { Rect } from "../art";
import { PET_H, PET_W, petRects, silhouetteRects, type Eyes, type Pose } from "../petArt";
import { PETS } from "../pets";
import type { Wear } from "../state";

const NONE: Wear = { hat: null, body: null, acc: null };
const COLS: { pose: Pose; eyes: Eyes; wear: Wear; label: string }[] = [
  { pose: "mid", eyes: "open", wear: NONE, label: "mid" },
  { pose: "up", eyes: "open", wear: NONE, label: "up" },
  { pose: "down", eyes: "blink", wear: NONE, label: "down blink" },
  { pose: "squash", eyes: "happy", wear: NONE, label: "squash happy" },
  { pose: "mid", eyes: "open", wear: { hat: "crown", body: "cape", acc: "shades" }, label: "crown cape shades" },
  { pose: "up", eyes: "open", wear: { hat: "cap", body: "tee", acc: "scarf" }, label: "cap tee scarf" },
  { pose: "mid", eyes: "happy", wear: { hat: "ribbon", body: null, acc: null }, label: "ribbon" },
  { pose: "squash", eyes: "happy", wear: { hat: "crown", body: "tee", acc: "shades" }, label: "squash dressed" },
];

function Sprite({ rects, x, y, px }: { rects: Rect[]; x: number; y: number; px: number }) {
  const by = new Map<string, string>();
  for (const [rx, ry, w, h, c] of rects) by.set(c, (by.get(c) ?? "") + `M${rx} ${ry}h${w}v${h}h${-w}z`);
  return (
    <svg width={PET_W * px} height={PET_H * px} viewBox={`0 0 ${PET_W} ${PET_H}`} shapeRendering="crispEdges" style={{ position: "absolute", left: x, top: y }}>
      {[...by].map(([c, d]) => <path key={c} d={d} fill={c} />)}
    </svg>
  );
}

function Sheet() {
  return (
    <AbsoluteFill style={{ backgroundColor: "#3d2470" }}>
      {COLS.map((c, i) => <div key={c.label} style={{ position: "absolute", left: 20 + i * 205, top: 4, width: 190, textAlign: "center", color: "#fff", fontSize: 18, fontFamily: "Menlo" }}>{c.label}</div>)}
      <div style={{ position: "absolute", left: 20 + 8 * 205, top: 4, width: 190, textAlign: "center", color: "#fff", fontSize: 18, fontFamily: "Menlo" }}>silhouette</div>
      {PETS.map((p, r) => (
        <div key={p.id}>
          {COLS.map((c, i) => <Sprite key={i} rects={petRects(p.id, c.pose, c.eyes, c.wear)} x={20 + i * 205} y={30 + r * 262} px={4.5} />)}
          <Sprite rects={silhouetteRects(p.id)} x={20 + 8 * 205} y={30 + r * 262} px={4.5} />
        </div>
      ))}
    </AbsoluteFill>
  );
}

registerRoot(() => <Composition id="pet-sheet" component={Sheet} width={1920} height={1080} fps={30} durationInFrames={1} />);
