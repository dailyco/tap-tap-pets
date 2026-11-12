// Tap Tap Pets: an idle game. The home screen holds three save slots (a pet's run each), the pets you bring home with
// sunlight (a sunlight for every 20 minutes on the play screen) and the settings. In play, coins come in every second
// and a tap on the pet brings more; the SHOP sells the pet's own tools, the CLOSET things to wear, tried on first.
// Played live with `raea play`; with nobody at the controls a cursor plays a demo, so `raea render` shows the game.
import { useEffect } from "react";
import { Audio, Composition, Sequence, registerRoot, staticFile, useCurrentFrame, useGameEvents, useGameState, useInput } from "raea";
import { INITIAL, step, type Game } from "./game";
import { deleteSlot, writeSlot, type SaveKey } from "./save";
import { Screen } from "./ui/screen";

export { playtest } from "./game";

// ---- sounds, one per thing that happens ----
// each path written out whole, so export-game finds the file and packs it into the app
const SFX = {
  tap: staticFile("sfx/tap.wav"), coin: staticFile("sfx/coin.wav"), buy: staticFile("sfx/buy.wav"), up: staticFile("sfx/up.wav"),
  fail: staticFile("sfx/fail.wav"), equip: staticFile("sfx/equip.wav"), open: staticFile("sfx/open.wav"), close: staticFile("sfx/close.wav"),
  start: staticFile("sfx/start.wav"), save: staticFile("sfx/save.wav"), fanfare: staticFile("sfx/fanfare.wav"),
  sunrise: staticFile("sfx/sunrise.wav"), reveal: staticFile("sfx/reveal.wav"), jackpot: staticFile("sfx/jackpot.wav"), delete: staticFile("sfx/delete.wav"),
};

function Sfx({ frames, src, volume, frame, live, g }: { frames: number[]; src: keyof typeof SFX; volume: number; frame: number; live: boolean; g: Game }) {
  if (!g.set.sound) return null;
  const keep = (live ? frames.filter((f) => frame - f < 90) : frames).filter((f) => f >= g.soundT);
  return (
    <>
      {keep.map((f) => (
        <Sequence key={f} from={f} durationInFrames={60} layout="none" name={`${src} ${f}`}>
          <Audio src={SFX[src]} volume={volume} />
        </Sequence>
      ))}
    </>
  );
}

const slotKey = (i: number) => `slot${i + 1}` as SaveKey;

export default function PixelPet() {
  const frame = useCurrentFrame();
  const g = useGameState(INITIAL, step);
  const live = !!(useInput() as { live?: boolean }).live;
  // writes, only while someone plays: the slot being played, the account, the settings, a deleted slot, and the old
  // single save moved into slot 1 (once; the old row stays as a backup)
  useEffect(() => { if (live && g.saveN > 0 && g.cur !== null) writeSlot(slotKey(g.cur), g.p); }, [g.saveN]);
  useEffect(() => { if (live && g.accN > 0) writeSlot("account", g.acc); }, [g.accN]);
  useEffect(() => { if (live && g.setN > 0) writeSlot("settings", g.set); }, [g.setN]);
  useEffect(() => { if (live && g.delN > 0 && g.delSlot !== null) deleteSlot(slotKey(g.delSlot)); }, [g.delN]);
  useEffect(() => { if (live && g.migrated && g.slots[0]) writeSlot("slot1", g.slots[0]); }, [g.migrated]);

  const taps = useGameEvents(INITIAL, step, (a, b) => b.taps > a.taps);
  const payouts = useGameEvents(INITIAL, step, (a, b) => b.payouts > a.payouts);
  const buys = useGameEvents(INITIAL, step, (a, b) => b.buys > a.buys);
  const ups = useGameEvents(INITIAL, step, (a, b) => b.ups > a.ups);
  const fails = useGameEvents(INITIAL, step, (a, b) => b.fails > a.fails);
  const equips = useGameEvents(INITIAL, step, (a, b) => b.equips > a.equips);
  const tries = useGameEvents(INITIAL, step, (a, b) => b.tries > a.tries);
  const opens = useGameEvents(INITIAL, step, (a, b) => b.opens > a.opens);
  const closes = useGameEvents(INITIAL, step, (a, b) => b.closes > a.closes);
  const starts = useGameEvents(INITIAL, step, (a, b) => b.starts > a.starts);
  const saves = useGameEvents(INITIAL, step, (a, b) => b.saves > a.saves);
  const toggles = useGameEvents(INITIAL, step, (a, b) => b.toggles > a.toggles);
  const suns = useGameEvents(INITIAL, step, (a, b) => b.suns > a.suns);
  const adopts = useGameEvents(INITIAL, step, (a, b) => b.adopts > a.adopts);
  const jackpots = useGameEvents(INITIAL, step, (a, b) => b.jackpots > a.jackpots);
  const deletes = useGameEvents(INITIAL, step, (a, b) => b.deletes > a.deletes);
  const done = useGameEvents(INITIAL, step, (a, b) => b.doneT > 0 && a.doneT < 0);

  const s = { frame, live, g };
  return (
    <Screen g={g} frame={frame}>
      <Sfx {...s} frames={taps} src="tap" volume={0.6} />
      <Sfx {...s} frames={payouts} src="coin" volume={0.22} />
      <Sfx {...s} frames={buys} src="buy" volume={0.7} />
      <Sfx {...s} frames={ups} src="up" volume={0.7} />
      <Sfx {...s} frames={fails} src="fail" volume={0.7} />
      <Sfx {...s} frames={equips} src="equip" volume={0.6} />
      <Sfx {...s} frames={tries} src="equip" volume={0.45} />
      <Sfx {...s} frames={opens} src="open" volume={0.5} />
      <Sfx {...s} frames={closes} src="close" volume={0.5} />
      <Sfx {...s} frames={starts} src="start" volume={0.6} />
      <Sfx {...s} frames={saves} src="save" volume={0.6} />
      <Sfx {...s} frames={toggles} src="equip" volume={0.5} />
      <Sfx {...s} frames={suns} src="sunrise" volume={0.7} />
      <Sfx {...s} frames={adopts} src="reveal" volume={0.7} />
      <Sfx {...s} frames={jackpots} src="jackpot" volume={0.7} />
      <Sfx {...s} frames={deletes} src="delete" volume={0.6} />
      <Sfx {...s} frames={done} src="fanfare" volume={0.7} />
    </Screen>
  );
}

// an hour of play (two frames past the fold-ahead limit, so sounds are cued as play reaches them); render a stretch with --frames
registerRoot(() => <Composition id="tap-tap-pets" component={PixelPet} width={1920} height={1080} fps={60} durationInFrames={60 * 60 * 60 + 2} />);
