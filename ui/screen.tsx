// Everything drawn for a game state at a frame: the bands, the world, the pet, and the screen's own parts.
import type { ReactNode } from "react";
import { Arena } from "raea/arena";
import { C } from "../art";
import type { Game } from "../game";
import { t } from "../i18n";
import { FH, FW, PET_CENTER } from "../layout";
import { DeletePanel, HomeField, HomeHud, PetsPanel, Reveal, SlotsPanel } from "./home";
import { Pet } from "./pet";
import { Ask, Closet, Cursor, DoneBanner, Hints, Hud, Pops, Saved, Shop, SunBanner, TopButtons } from "./play";
import { FitIcon, Label, UI } from "./pixels";
import { Settings } from "./settings";
import { Scene } from "./sky";

/** everything drawn for a state at a frame (the sounds ride along as children) */
export function Screen({ g, frame, children }: { g: Game; frame: number; children?: ReactNode }) {
  const L = g.set.lang;
  const play = g.phase === "play";
  const showDone = play && g.doneT > 0 && frame - g.doneT < 240;
  const bob = Math.floor(frame / 8) % 2 ? 8 : 0;
  return (
    <Arena width={FW} height={FH} background={UI.stage}
      score={play ? <Hud g={g} frame={frame} /> : <HomeHud g={g} frame={frame} />}
      banner={play && frame - g.sunT >= 0 && frame - g.sunT < 180 ? <SunBanner g={g} /> : showDone ? <DoneBanner g={g} /> : null}
      hint={<Hints g={g} />}>
      <Scene frame={frame} sunFrames={g.acc.sunFrames} />
      <Pet g={g} frame={frame} />
      {play && g.taps === 0 ? (
        <>
          <Label s={t(L, "tapMe")} px={4} x={g.petX} y={262 + bob} color={C.gold} align="center" />
          <FitIcon name="down" box={60} x={g.petX - 30} y={296 + bob} />
        </>
      ) : null}
      {play ? (
        <>
          <Pops g={g} frame={frame} />
          <TopButtons g={g} frame={frame} />
          {g.panel === "shop" ? <Shop g={g} frame={frame} /> : null}
          {g.panel === "closet" ? <Closet g={g} frame={frame} /> : null}
          {g.ask ? <Ask g={g} /> : null}
        </>
      ) : (
        <>
          <HomeField g={g} frame={frame} />
          {g.homeView === "continue" || g.homeView === "new" || g.homeView === "delete" || g.homeView === "overwrite" ? <SlotsPanel g={g} frame={frame} /> : null}
          {g.homeView === "pets" || g.homeView === "pick" ? <PetsPanel g={g} frame={frame} /> : null}
          {g.homeView === "delete" || g.homeView === "overwrite" ? <DeletePanel g={g} /> : null}
          <Reveal g={g} frame={frame} />
        </>
      )}
      {g.settings ? <Settings g={g} /> : null}
      <Saved g={g} frame={frame} />
      {!g.human ? <Cursor g={g} /> : null}
      {children}
    </Arena>
  );
}

