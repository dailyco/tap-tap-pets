// A check sheet: game states made by hand, four to a page, drawn by the game's own Screen. Not used by the game.
import { AbsoluteFill, Composition, registerRoot, useCurrentFrame } from "raea";
import { makeInitial, type Game } from "../game";
import { DEFAULT_SETTINGS, freshSlot, type Lang, type SlotData } from "../state";
import { Screen } from "../ui/screen";

const base = (lang: Lang): Game => ({ ...makeInitial(null), set: { ...DEFAULT_SETTINGS, lang }, human: true, cursor: null });
const rich: SlotData = { ...freshSlot("cat"), coins: 1_234_567, owned: ["crown", "tee", "shades"], wear: { hat: "crown", body: "tee", acc: "shades" }, playFrames: 3600 * 125, tools: [10, 10] };
const mochi: SlotData = { ...freshSlot("mochi"), coins: 42.5, playFrames: 3600 * 12 };
const home = (lang: Lang): Game => ({ ...base(lang), slots: [rich, mochi, null], acc: { sun: 4, sunFrames: 30000, pets: ["cat", "mochi"] }, lastPet: "mochi", cur: 1 });
const play = (lang: Lang, p: SlotData, over: Partial<Game> = {}): Game => ({ ...home(lang), phase: "play", cur: 0, p, tapT: -999, taps: 3, ...over });
const upa: SlotData = { ...freshSlot("upa"), coins: 75, tools: [3, 2] };

const PAGES: [string, Game, number][][] = [
  [["mochi shop ko", play("ko", { ...mochi, tools: [6, 4] }, { panel: "shop" }), 0], ["mochi shop en", play("en", { ...mochi, tools: [12, 9] }, { panel: "shop" }), 0], ["mochi hud ko", play("ko", mochi), 0], ["mochi hud en", play("en", mochi), 0]],
  [["walk left ko", play("ko", rich, { petX: 380, facing: "left", walking: true }), 6], ["walk right en", play("en", upa, { petX: 1250, facing: "right", walking: true }), 0], ["left, closet open", play("ko", mochi, { petX: 300, facing: "left", panel: "closet", pick: "crown" }), 0], ["settings hint en", { ...home("en"), settings: true }, 0]],
  [["pets ko all owned but mochi", { ...home("ko"), homeView: "pets", acc: { sun: 9, sunFrames: 0, pets: ["cat", "upa", "mungge"] } }, 0], ["pets en mochi owned", { ...home("en"), homeView: "pets", acc: { sun: 1, sunFrames: 0, pets: ["cat", "mochi"] } }, 0], ["pick ko", { ...home("ko"), homeView: "pick", target: 2 }, 0], ["pets ko", { ...home("ko"), homeView: "pets" }, 0]],
  [["settings ko", { ...home("ko"), settings: true }, 0], ["settings en", { ...home("en"), settings: true }, 0], ["settings en hover ko", { ...home("en"), settings: true, cursor: { x: 1046, y: 524, down: false } }, 0], ["settings ko play", { ...play("ko", rich), settings: true }, 0]],
  [["main ko", home("ko"), 0], ["continue en", { ...home("en"), homeView: "continue", slotMode: "continue" }, 0], ["new ko (hover slot 1)", { ...home("ko"), homeView: "new", slotMode: "new", cursor: { x: 330, y: 330, down: false } }, 0], ["overwrite en", { ...home("en"), homeView: "overwrite", slotMode: "new", target: 0 }, 0]],
  [["home ko", home("ko"), 0], ["home en", home("en"), 0], ["pets en", { ...home("en"), homeView: "pets", acc: { sun: 4, sunFrames: 0, pets: ["cat", "upa"] } }, 0], ["pick ko", { ...home("ko"), homeView: "pick", target: 2 }, 0]],
  [["delete en", { ...home("en"), homeView: "delete", target: 0 }, 0], ["reveal ko +40", { ...home("ko"), homeView: "pets", reveal: { pet: "mungge", t: 0 } }, 40], ["reveal en +70", { ...home("en"), homeView: "pets", reveal: { pet: "upa", t: 0 } }, 70], ["settings ko", { ...home("ko"), settings: true }, 0]],
  [["settings en", { ...home("en"), settings: true }, 0], ["shop ko rich", play("ko", rich, { panel: "shop" }), 0], ["shop en upa", play("en", upa, { panel: "shop" }), 0], ["closet en pick", play("en", mochi, { panel: "closet", pick: "crown" }), 0]],
  [["morning ko upa", play("ko", upa, { acc: { sun: 2, sunFrames: 0.1 * 72000, pets: ["cat", "upa"] } }), 0], ["day en mungge", play("en", { ...freshSlot("mungge"), coins: 9 }, { acc: { sun: 0, sunFrames: 0.35 * 72000, pets: ["cat", "mungge"] } }), 0], ["sunset ko mochi", play("ko", mochi, { acc: { sun: 1, sunFrames: 0.6 * 72000, pets: ["cat", "mochi"] } }), 0], ["night en cat", play("en", rich, { acc: { sun: 3, sunFrames: 0.85 * 72000, pets: ["cat"] } }), 0]],
  [["sunrise ko", play("ko", rich, { sunT: 0, acc: { sun: 5, sunFrames: 30, pets: ["cat"] } }), 40], ["sunrise en", play("en", upa, { sunT: 0, acc: { sun: 1, sunFrames: 30, pets: ["cat", "upa"] } }), 40], ["home night ko", { ...home("ko"), acc: { sun: 4, sunFrames: 0.9 * 72000, pets: ["cat", "mochi"] } }, 0], ["home day en", { ...home("en"), acc: { sun: 4, sunFrames: 0.3 * 72000, pets: ["cat", "mochi"] } }, 0]],
  [["closet ko", play("ko", rich, { panel: "closet", pick: "cape" }), 0], ["ask en", play("en", upa, { ask: true }), 0], ["jackpot ko", play("ko", upa, { pops: [{ x: 800, y: 380, n: 15, t: 0, idle: false, big: true }] }), 8], ["hud en", play("en", rich), 0]],
  [["shop ko lv 10 next", play("ko", { ...rich, tools: [9, 9] }, { panel: "shop" }), 0], ["shop en lv 10 next", play("en", { ...rich, tools: [9, 9] }, { panel: "shop" }), 0], ["shop ko lv 30 next", play("ko", { ...rich, coins: 4.5e10, tools: [29, 29] }, { panel: "shop" }), 0], ["hud ko lv 40", play("ko", { ...rich, coins: 4.5e12, tools: [39, 40] }), 0]],
  [["shop ko cat speed 3", play("ko", { ...rich, tools: [12, 10, 2] }, { panel: "shop" }), 0], ["shop en mochi max", play("en", { ...mochi, coins: 1_374_612_000_000, tools: [33, 23, 9] }, { panel: "shop" }), 0], ["shop ko upa new", play("ko", { ...upa, coins: 1500 }, { panel: "shop" }), 0], ["shop en mungge", play("en", { ...freshSlot("mungge"), coins: 9000, tools: [4, 3, 1] }, { panel: "shop", acc: { sun: 0, sunFrames: 0.35 * 72000, pets: ["cat", "mungge"] } }), 0]],
];

function Sheet() {
  const page = PAGES[Math.min(PAGES.length - 1, useCurrentFrame())];
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {page.map(([label, g, frame], i) => (
        <div key={label} style={{ position: "absolute", left: (i % 2) * 960, top: Math.floor(i / 2) * 540, width: 960, height: 540, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: "scale(0.5)", transformOrigin: "0 0" }}>
            <Screen g={g} frame={frame} />
          </div>
          <div style={{ position: "absolute", left: 6, top: 4, color: "#0f0", fontSize: 18, fontFamily: "Menlo" }}>{label}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
}

registerRoot(() => <Composition id="ui-sheet" component={Sheet} width={1920} height={1080} fps={30} durationInFrames={PAGES.length} />);
