// The app's icon: the pet in its cap on the sunset, 1024 square.
import { AbsoluteFill, Composition, registerRoot } from "raea";
import { pet } from "./art";

function Icon() {
  const rects = pet("mid", "happy", { hat: "cap", body: null, acc: null });
  return (
    <AbsoluteFill style={{ backgroundColor: "#00000000" }}>
      <div style={{ position: "absolute", left: 100, top: 100, width: 824, height: 824, borderRadius: 180, background: "linear-gradient(#2f1d5c, #70358a)", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 640, width: 824, height: 40, backgroundColor: "#9be564" }} />
        <div style={{ position: "absolute", left: 0, top: 680, width: 824, height: 144, backgroundColor: "#6b4226" }} />
        <svg width={32 * 24} height={28 * 24} viewBox="0 0 32 28" shapeRendering="crispEdges" style={{ position: "absolute", left: 28, top: -10 }}>
          {rects.map(([x, y, w, h, c], i) => <rect key={i} x={x} y={y} width={w} height={h} fill={c} />)}
        </svg>
      </div>
    </AbsoluteFill>
  );
}
registerRoot(() => <Composition id="icon" component={Icon} width={1024} height={1024} fps={30} durationInFrames={1} />);
