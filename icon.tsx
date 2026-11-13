// The app's icon (raea render icon.tsx --at 0 → media/app/icon.png): the cat as the game draws it now (petArt.ts),
// happy, on the grass under an evening sky, two coins in the air. 1024 square.
import { AbsoluteFill, Composition, registerRoot } from "raea";
import { icon, type Rect } from "./art";
import { PET_H, PET_W, petRects } from "./petArt";

const PX = 14;
const Cells = ({ rects, w, h, px, x, y }: { rects: Rect[]; w: number; h: number; px: number; x: number; y: number }) => (
  <svg width={w * px} height={h * px} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" style={{ position: "absolute", left: x, top: y }}>
    {rects.map(([rx, ry, rw, rh, c], i) => <rect key={i} x={rx} y={ry} width={rw} height={rh} fill={c} />)}
  </svg>
);

function Icon() {
  const cat = petRects("cat", "mid", "happy", { hat: null, body: null, acc: null });
  const coin = icon("coin");
  return (
    <AbsoluteFill style={{ backgroundColor: "#00000000" }}>
      <div style={{ position: "absolute", left: 100, top: 100, width: 824, height: 824, borderRadius: 180, background: "linear-gradient(#2f1d5c, #70358a)", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 640, width: 824, height: 40, backgroundColor: "#9be564" }} />
        <div style={{ position: "absolute", left: 0, top: 680, width: 824, height: 144, backgroundColor: "#6b4226" }} />
        {/* the canvas's row 43 (just under the feet) on the grass, as on the field */}
        <Cells rects={cat} w={PET_W} h={PET_H} px={PX} x={(824 - PET_W * PX) / 2} y={640 + 6 - 43 * PX} />
        <Cells rects={coin.rects} w={coin.w} h={coin.h} px={7} x={44} y={150} />
        <Cells rects={coin.rects} w={coin.w} h={coin.h} px={6} x={700} y={96} />
      </div>
    </AbsoluteFill>
  );
}
registerRoot(() => <Composition id="icon" component={Icon} width={1024} height={1024} fps={30} durationInFrames={1} />);
