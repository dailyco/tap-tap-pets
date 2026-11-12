// The drawing kit every screen uses: pixels as SVG paths (one per colour), text in the pixel font or, for Korean, the
// Mac's Korean font with the same hard shadow, icons, chunky buttons, panels.
import { memo, type ReactNode } from "react";
import { C, canDraw, icon, text, textWidth, type Rect } from "../art";
import type { Game } from "../game";
import type { Box } from "../layout";

export const UI = {
  stage: "#120c22", panel: "#2b2147", rim: "#43356e", row: "#3a2d63", rowHover: "#4b3b80", rowShadow: "#231a3d",
  worn: "#2d5a4f", wornHover: "#3a7262", ok: "#58c47a", okDark: "#3a9a5a", bad: "#d9485f", dim: "#b3a6e6", faint: "#8c7fbf",
  well: "#5e4d96", price: C.gold, poor: "#ff8a8a", off: "#4b4470", offDark: "#3a3459",
};
const KO_FONT = "Apple SD Gothic Neo";

const pathCache = new WeakMap<Rect[], { paths: [string, string][]; w: number; h: number }>();
function paths(rects: Rect[]) {
  let kept = pathCache.get(rects);
  if (!kept) {
    const by = new Map<string, string>();
    let w = 0, h = 0;
    for (const [x, y, rw, rh, c] of rects) {
      by.set(c, (by.get(c) ?? "") + `M${x} ${y}h${rw}v${rh}h${-rw}z`);
      w = Math.max(w, x + rw); h = Math.max(h, y + rh);
    }
    kept = { paths: [...by], w, h };
    pathCache.set(rects, kept);
  }
  return kept;
}

function PixelsDrawn({ rects, px, x, y, color, opacity, w: forceW, h: forceH, flip }: {
  rects: Rect[]; px: number; x: number; y: number; color?: string; opacity?: number; w?: number; h?: number; flip?: boolean;
}) {
  const { paths: ps, w: rw, h: rh } = paths(rects);
  const w = forceW ?? rw, h = forceH ?? rh;
  if (!w || !h) return null;
  return (
    <svg width={w * px} height={h * px} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" style={{ position: "absolute", left: x, top: y, opacity, transform: flip ? "scaleX(-1)" : undefined }}>
      {ps.map(([c, d]) => <path key={c} d={d} fill={color ?? c} />)}
    </svg>
  );
}

export const rect = (x: number, y: number, w: number, h: number, c: string): Rect => [x, y, w, h, c];
/** a frame stepped down to the last even one (or the last fourth): what moves is drawn on the same frames, so the
 *  frames between leave the screen as it was and live play doesn't paint them again (raea's Live::draw). Counted
 *  from the screen's frame, never from when each thing started: started on odd frames, they'd fill the odd ones */
export const onTwos = (frame: number) => frame - (frame % 2);
export const onFours = (frame: number) => frame - (frame % 4);
export const over = (g: Game, b: Box) => !!g.cursor && g.cursor.x >= b.x && g.cursor.x < b.x + b.w && g.cursor.y >= b.y && g.cursor.y < b.y + b.h;

type Align = "left" | "center" | "right";

/** text in the pixel font with a hard drop shadow; x is the left edge, the middle or the right edge by `align` */
function PTextDrawn({ s, px, x, y, color = C.white, align = "left", opacity, shadow = true }: {
  s: string; px: number; x: number; y: number; color?: string; align?: Align; opacity?: number; shadow?: boolean;
}) {
  const w = textWidth(s, px);
  const left = Math.round(align === "center" ? x - w / 2 : align === "right" ? x - w : x);
  const rects = text(s);
  return (
    <>
      {shadow ? <Pixels rects={rects} px={px} x={left + px} y={y + px} color={C.ink} opacity={opacity} /> : null}
      <Pixels rects={rects} px={px} x={left} y={y} color={color} opacity={opacity} />
    </>
  );
}

/** how wide a text draws: the pixel font's own width, or for the Korean font about 1.05 em a Hangul character, 0.65 the rest */
export const textW = (s: string, px: number) =>
  canDraw(s) ? textWidth(s, px) : Math.ceil([...s].reduce((n, ch) => n + (/[\uac00-\ud7a3\u3131-\u318e]/.test(ch) ? 1.05 : ch === " " ? 0.33 : 0.65), 0) * Math.round(px * 8.2));

/** any text: the pixel font when it can draw it, else the Korean font at the same size, shadowed the same way */
function LabelDrawn({ s, px, x, y, color = C.white, align = "left", opacity, shadow = true }: {
  s: string; px: number; x: number; y: number; color?: string; align?: Align; opacity?: number; shadow?: boolean;
}) {
  if (canDraw(s)) return <PText s={s} px={px} x={x} y={y} color={color} align={align} opacity={opacity} shadow={shadow} />;
  // a box the text's own size (Hangul about 1.05 em a character, the rest about 0.65), so nothing sticks out of it
  const size = Math.round(px * 8.2), line = px * 7;
  const W = textW(s, px) + px * 2;
  const left = align === "center" ? x - W / 2 : align === "right" ? x - W : x;
  const style = (dx: number, c: string) => ({
    position: "absolute" as const, left: left + dx, top: y - px * 0.6 + (dx ? px : 0), width: W, height: line + px * 2, textAlign: align,
    fontFamily: KO_FONT, fontWeight: 800, fontSize: size, lineHeight: `${line + px}px`, color: c, opacity, whiteSpace: "nowrap" as const,
  });
  return (
    <>
      {shadow ? <div style={style(px, C.ink)}>{s}</div> : null}
      <div style={style(0, color)}>{s}</div>
    </>
  );
}

function IconDrawn({ name, px, x, y, opacity }: { name: string; px: number; x: number; y: number; opacity?: number }) {
  return <Pixels rects={icon(name).rects} px={px} x={x} y={y} opacity={opacity} />;
}

/** an icon scaled to fit a square box, centred in it */
function FitIconDrawn({ name, box, x, y, opacity }: { name: string; box: number; x: number; y: number; opacity?: number }) {
  const { w, h } = icon(name);
  const px = Math.max(1, Math.floor(box / Math.max(w, h)));
  return <Icon name={name} px={px} x={x + Math.round((box - w * px) / 2)} y={y + Math.round((box - h * px) / 2)} opacity={opacity} />;
}

/** a chunky pixel button: an ink rim, a fill, a darker lip; it sinks while pressed */
export function PixelButton({ g, box, fill, shade, children, dx = 0 }: {
  g: Game; box: Box; fill: [string, string]; shade: string; children: (dy: number) => ReactNode; dx?: number;
}) {
  const hot = over(g, box);
  const dy = hot && g.cursor?.down ? 4 : 0;
  const rects: Rect[] = [
    rect(0, 0, box.w, box.h, C.ink), rect(6, 6, box.w - 12, box.h - 12, hot ? fill[1] : fill[0]),
    rect(6, box.h - 20, box.w - 12, 14, shade), rect(6, 6, box.w - 12, 6, "#ffffff55"),
  ];
  return (
    <>
      <Pixels rects={rects} px={1} x={box.x + dx} y={box.y + dy} />
      {children(dy)}
    </>
  );
}

function BadgeDrawn({ x, y, frame }: { x: number; y: number; frame: number }) {
  const bounce = Math.floor(frame / 10) % 2 ? -4 : 0;
  return (
    <>
      <Pixels rects={[rect(4, 0, 24, 32, C.ink), rect(0, 4, 32, 24, C.ink), rect(4, 4, 24, 24, C.red)]} px={1} x={x} y={y + bounce} />
      <PText s="!" px={3} x={x + 16} y={y + 5 + bounce} align="center" shadow={false} />
    </>
  );
}

/** a panel: an ink rim, a coloured border, the panel's ground */
function FrameDrawn({ box, border = UI.rim }: { box: Box; border?: string }) {
  return <Pixels rects={[rect(0, 0, box.w, box.h, C.ink), rect(6, 6, box.w - 12, box.h - 12, border), rect(12, 12, box.w - 24, box.h - 24, UI.panel)]} px={1} x={box.x} y={box.y} />;
}

/** the field dimmed behind a box that's asking something */
export const Dim = ({ w, h }: { w: number; h: number }) => <Pixels rects={[rect(0, 0, w, h, C.ink)]} px={1} x={0} y={0} opacity={0.55} />;

// Each drawing redone only when what it's given changes: the screen is made again every frame, and most of it (the
// pet, the text, the icons, all from kept rects) is the same picture as the frame before. Skipping those keeps a
// frame's work small (React's render, and the page raea draws, which a frame without changes doesn't paint).
export const Pixels = memo(PixelsDrawn);
export const PText = memo(PTextDrawn);
export const Label = memo(LabelDrawn);
export const Icon = memo(IconDrawn);
export const FitIcon = memo(FitIconDrawn);
export const Badge = memo(BadgeDrawn);
export const Frame = memo(FrameDrawn);
