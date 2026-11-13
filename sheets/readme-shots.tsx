// The README's screenshots (docs/images): the game played by its own step from a save, then drawn whole by Screen.
//   raea render sheets/readme-shots.tsx --at 0,1,2 -o out/readme-shots/   (0 home, 1 play, 2 shop)
import { Composition, registerRoot, useCurrentFrame } from "raea";
import { makeInitial, type Game } from "../game";
import { CONTINUE_BTN, SLOT_CARDS } from "../layout";
import { DEFAULT_SETTINGS, freshSlot, type Loaded, type SlotData } from "../state";
import { drive, type Cue } from "../tests/drive";
import { Screen } from "../ui/screen";

const cat: SlotData = {
  ...freshSlot("cat"), coins: 1_234_567_890, earned: 9_876_543_210, tools: [20, 18, 9],
  owned: ["ribbon", "crown", "tee", "shades"], wear: { hat: "crown", body: "tee", acc: null }, playFrames: 3600 * 90,
};
const mochi: SlotData = { ...freshSlot("mochi"), coins: 4_200, tools: [6, 5, 1], playFrames: 3600 * 12 };
const loaded: Loaded = { account: { sun: 4, sunFrames: 30_000, pets: ["cat", "mochi"] }, slots: [cat, mochi, null], settings: DEFAULT_SETTINGS, migrated: false, firstRun: false };

/** the home screen, then slot 1 played a while (ten payouts a second, one tap), then its shop open */
const home = drive(makeInitial(loaded), {}, 10);
const cues: Record<number, Cue> = { 5: { click: CONTINUE_BTN }, 15: { click: SLOT_CARDS[0] }, 86: { keys: [" "] } };
const play = drive(makeInitial(loaded), cues, 100);
const shop = drive(play, { 100: { keys: ["s"] } }, 12, 100);

const SHOTS: [Game, number][] = [[home, 9], [play, 99], [shop, 111]];

function Shots() {
  const [g, frame] = SHOTS[Math.min(SHOTS.length - 1, useCurrentFrame())];
  return <Screen g={{ ...g, cursor: null }} frame={frame} />;
}
registerRoot(() => <Composition id="readme-shots" component={Shots} width={1920} height={1080} fps={60} durationInFrames={SHOTS.length} />);
