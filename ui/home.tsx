// The home screen: three save slots, the PETS panel (unowned pets only as silhouettes), picking a new slot's pet,
// asking before a slot is deleted, and the moment a new pet arrives.
import { C, fmt } from "../art";
import { petCard, slotSummary, type Game } from "../game";
import { t, type Key } from "../i18n";
import {
  CONTINUE_BTN, DEL_CANCEL, DEL_OK, DEL_PANEL, FH, FW, GEAR_HOME, NEW_BTN, PET_BUY, PET_CARDS, PETS_BTN, PETS_PANEL, SLOT_CARDS,
  SLOT_DELETE, SLOTS_PANEL, type Box,
} from "../layout";
import { PET_H, PET_W, petRects, silhouetteRects } from "../petArt";
import { PETS } from "../pets";
import { Dim, FitIcon, Frame, Icon, Label, PixelButton, Pixels, UI, over, rect, textW } from "./pixels";
import { GearButton } from "./settings";

/** text broken into lines at "\n" and at spaces so that no line is wider than `maxW` (a longer word keeps its own line) */
export function WrapLabel({ s, px, x, y, maxW, color, align = "center" }: { s: string; px: number; x: number; y: number; maxW: number; color?: string; align?: "left" | "center" }) {
  const width = (str: string) => textW(str, px);
  const lines: string[] = [];
  for (const part of s.split("\n")) {
    const start = lines.length;
    for (const w of part.split(" ")) {
      const last = lines.length > start ? lines[lines.length - 1] : null;
      if (last !== null && width(`${last} ${w}`) <= maxW) lines[lines.length - 1] = `${last} ${w}`;
      else lines.push(w);
    }
  }
  return <>{lines.map((line, i) => <Label key={i} s={line} px={px} x={x} y={y + i * px * 11} color={color} align={align} />)}</>;
}

function SlotCard({ g, i, frame }: { g: Game; i: number; frame: number }) {
  const L = g.set.lang;
  const b = SLOT_CARDS[i];
  const s = slotSummary(g.slots[i]);
  const hot = over(g, b) && (g.homeView === "continue" || g.homeView === "new") && !g.settings;
  const cont = g.slotMode === "continue";
  const slot = g.slots[i];
  return (
    <>
      <Frame box={b} border={hot ? C.gold : UI.rim} />
      <Label s={t(L, "slot", { n: i + 1 })} px={3} x={b.x + 28} y={b.y + 28} color={UI.faint} />
      {s && slot ? (
        <>
          <PixelButton g={g} box={SLOT_DELETE[i]} fill={["#7a3a4a", "#a14a5c"]} shade="#5a2a36">
            {(dy) => <FitIcon name="trash" box={34} x={SLOT_DELETE[i].x + 10} y={SLOT_DELETE[i].y + 6 + dy} />}
          </PixelButton>
          <Pixels rects={petRects(slot.pet, Math.floor(frame / 24) % 4 === 1 ? "up" : "mid", "open", slot.wear)} px={4.5} x={b.x + 12} y={b.y + 56} w={PET_W} h={PET_H} />
          <Label s={t(L, PETS.find((p) => p.id === s.pet)!.name)} px={4} x={b.x + 200} y={b.y + 84} />
          <Icon name="coin" px={3} x={b.x + 198} y={b.y + 126} />
          <Label s={fmt(s.coins)} px={4} x={b.x + 238} y={b.y + 130} color={C.gold} />
          <Label s={t(L, "styleN", { n: s.style })} px={3} x={b.x + 200} y={b.y + 176} color={UI.dim} />
          <Label s={t(L, "minutesN", { n: s.minutes })} px={3} x={b.x + 200} y={b.y + 206} color={UI.dim} />
          {!cont && hot ? <Label s={t(L, "startOver")} px={3} x={b.x + b.w - 20} y={b.y + 238} align="right" color={UI.poor} /> : null}
        </>
      ) : (
        <>
          <Label s="+" px={10} x={b.x + b.w / 2} y={b.y + 84} align="center" color={hot ? C.gold : UI.faint} />
          <Label s={t(L, cont ? "empty" : "newGame")} px={4} x={b.x + b.w / 2} y={b.y + 176} align="center" color={hot ? C.white : UI.dim} />
        </>
      )}
    </>
  );
}

export function HomeField({ g }: { g: Game; frame: number }) {
  const L = g.set.lang;
  const saved = g.slots.filter((x) => x).length;
  return (
    <>
      <GearButton g={g} box={GEAR_HOME} />
      <PixelButton g={g} box={PETS_BTN} fill={["#ffcf4a", "#ffe07a"]} shade="#d9962a">
        {(dy) => (
          <>
            <FitIcon name="sun" box={60} x={PETS_BTN.x + 14} y={PETS_BTN.y + 14 + dy} />
            <Label s={t(L, "pets")} px={4} x={PETS_BTN.x + 84} y={PETS_BTN.y + 30 + dy} color={C.ink} shadow={false} />
          </>
        )}
      </PixelButton>
      <PixelButton g={g} box={CONTINUE_BTN} fill={saved ? [UI.ok, "#7ad99a"] : [UI.off, UI.off]} shade={saved ? UI.okDark : UI.offDark}>
        {(dy) => <Label s={t(L, "continue")} px={5} x={CONTINUE_BTN.x + CONTINUE_BTN.w / 2} y={CONTINUE_BTN.y + 28 + dy} color={saved ? C.white : UI.faint} align="center" />}
      </PixelButton>
      <Label s={saved ? t(L, "savesN", { n: saved }) : t(L, "noSave")} px={3} x={CONTINUE_BTN.x + CONTINUE_BTN.w / 2} y={CONTINUE_BTN.y + CONTINUE_BTN.h + 14} color={UI.dim} align="center" />
      <PixelButton g={g} box={NEW_BTN} fill={["#ffcf4a", "#ffe07a"]} shade="#d9962a">
        {(dy) => <Label s={t(L, "newGame")} px={5} x={NEW_BTN.x + NEW_BTN.w / 2} y={NEW_BTN.y + 28 + dy} color={C.ink} align="center" shadow={false} />}
      </PixelButton>
      <Label s={saved < 3 ? t(L, "emptyN", { n: 3 - saved }) : t(L, "slotsFull")} px={3} x={NEW_BTN.x + NEW_BTN.w / 2} y={NEW_BTN.y + NEW_BTN.h + 14} color={UI.dim} align="center" />
    </>
  );
}

/** the three slots, opened from CONTINUE or NEW GAME */
export function SlotsPanel({ g, frame }: { g: Game; frame: number }) {
  const L = g.set.lang;
  const p = SLOTS_PANEL;
  return (
    <>
      <Dim w={FW} h={FH} />
      <Frame box={p} border={g.slotMode === "continue" ? UI.ok : C.gold} />
      <Label s={t(L, g.slotMode === "continue" ? "continue" : "newGame")} px={5} x={p.x + 40} y={p.y + 30} color={g.slotMode === "continue" ? "#9cf0b8" : C.gold} />
      {[0, 1, 2].map((i) => <SlotCard key={i} g={g} i={i} frame={frame} />)}
    </>
  );
}

/** the band over the home screen: the title, and the sunlight in hand */
export function HomeHud({ g, frame }: { g: Game; frame: number }) {
  const bob = Math.floor(frame / 30) % 2 ? 2 : 0;
  return (
    <>
      <Label s={t(g.set.lang, "title")} px={10} x={960} y={34 + bob} color={C.gold} align="center" />
      <FitIcon name="sun" box={64} x={1560} y={40} />
      <Label s={t(g.set.lang, "hud.sun")} px={3} x={1644} y={28} color={UI.faint} />
      <Label s={String(g.acc.sun)} px={7} x={1644} y={60} color={C.gold} />
    </>
  );
}

function PetCardView({ g, i, frame }: { g: Game; i: number; frame: number }) {
  const L = g.set.lang;
  const b = PET_CARDS[i];
  const def = PETS[i];
  const card = petCard(g.acc, def.id);
  const pick = g.homeView === "pick";
  const note = g.note && g.note.panel === "pets" && g.note.row === i ? frame - g.note.t : -1;
  const shake = note >= 0 && note < 12 && !g.note!.ok ? (note % 4 < 2 ? -6 : 6) : 0;
  const cx = b.x + b.w / 2;
  const btn: Box = PET_BUY[i];
  const active = pick ? card.owned : card.canBuy;
  // a pet already home has no button in the PETS panel: its picture and words sit in the card's middle
  const top = b.y + (card.owned && !pick ? 90 : 0);
  return (
    <>
      <Pixels rects={[rect(0, 0, b.w, b.h, C.ink), rect(4, 4, b.w - 8, b.h - 8, over(g, b) ? UI.rowHover : UI.row)]} px={1} x={b.x} y={b.y} />
      <Pixels rects={card.owned ? petRects(def.id, Math.floor(frame / 24) % 4 === 1 ? "up" : "mid", "open", { hat: null, body: null, acc: null }) : silhouetteRects(def.id)}
        px={6} x={cx - (PET_W * 6) / 2} y={top + 6} w={PET_W} h={PET_H} />
      <Label s={t(L, card.name as Key)} px={5} x={cx} y={top + 290} align="center" color={card.owned ? C.white : UI.faint} />
      <WrapLabel s={t(L, def.ability)} px={3} x={cx} y={top + 348} maxW={b.w - 36} color={C.gold} />
      {card.owned ? (
        <Label s={t(L, "owned")} px={3} x={cx} y={top + 420} align="center" color="#9cf0b8" />
      ) : (
        <>
          <Icon name="sun" px={3} x={cx - 50} y={b.y + 412} />
          <Label s={String(def.price)} px={5} x={cx - 6} y={b.y + 416} color={card.canBuy ? C.gold : UI.poor} />
          {!card.canBuy ? <WrapLabel s={t(L, "needSun", { n: def.price - g.acc.sun })} px={2.5} x={cx} y={b.y + 466} maxW={b.w - 30} color={UI.poor} /> : null}
        </>
      )}
      {pick || !card.owned ? (
        <PixelButton g={g} box={btn} dx={shake} fill={active ? [UI.ok, "#7ad99a"] : [UI.off, "#5a5285"]} shade={active ? UI.okDark : UI.offDark}>
          {(dy) => <Label s={t(L, pick ? (card.owned ? "pick" : "locked") : "buy")} px={4} x={btn.x + btn.w / 2 + shake} y={btn.y + 28 + dy} align="center" color={active ? C.white : UI.faint} />}
        </PixelButton>
      ) : null}
    </>
  );
}

export function PetsPanel({ g, frame }: { g: Game; frame: number }) {
  const L = g.set.lang;
  const p = PETS_PANEL;
  return (
    <>
      <Dim w={FW} h={FH} />
      <Frame box={p} border={C.gold} />
      <FitIcon name="sun" box={52} x={p.x + 30} y={p.y + 22} />
      <Label s={t(L, g.homeView === "pick" ? "pickPet" : "pets")} px={5} x={p.x + 96} y={p.y + 30} color={C.gold} />
      {PETS.map((_, i) => <PetCardView key={i} g={g} i={i} frame={frame} />)}
    </>
  );
}

export function DeletePanel({ g }: { g: Game }) {
  const L = g.set.lang;
  const p = DEL_PANEL;
  const over = g.homeView === "overwrite";
  return (
    <>
      <Dim w={FW} h={FH} />
      <Frame box={p} border={over ? C.gold : UI.bad} />
      <FitIcon name={over ? "sun" : "trash"} box={56} x={p.x + 40} y={p.y + 36} />
      <Label s={t(L, over ? "overwriteAsk" : "deleteAsk", { n: (g.target ?? 0) + 1 })} px={over ? 4 : 5} x={p.x + 116} y={p.y + 48} />
      <Label s={t(L, over ? "overwriteSub" : "deleteSub")} px={3} x={p.x + p.w / 2} y={p.y + 140} align="center" color={UI.poor} />
      <PixelButton g={g} box={DEL_OK} fill={[UI.bad, "#e8667a"]} shade="#a83246">
        {(dy) => <Label s={t(L, over ? "startOver" : "delete")} px={over ? 4 : 5} x={DEL_OK.x + DEL_OK.w / 2} y={DEL_OK.y + (over ? 30 : 26) + dy} align="center" />}
      </PixelButton>
      <PixelButton g={g} box={DEL_CANCEL} fill={[UI.off, "#5a5285"]} shade={UI.offDark}>
        {(dy) => <Label s={t(L, "cancel")} px={5} x={DEL_CANCEL.x + DEL_CANCEL.w / 2} y={DEL_CANCEL.y + 26 + dy} align="center" />}
      </PixelButton>
    </>
  );
}

/** a new pet arrives: its silhouette lights up and fills with colour, it hops, its name shows */
export function Reveal({ g, frame }: { g: Game; frame: number }) {
  if (!g.reveal) return null;
  const L = g.set.lang;
  const a = frame - g.reveal.t;
  const k = Math.min(1, Math.max(0, a / 60));
  const hop = a >= 60 && a < 90 ? -Math.round(Math.sin(((a - 60) / 30) * Math.PI) * 40) : 0;
  const box: Box = { x: 500, y: 120, w: 600, h: 660 };
  const px = 9, x = box.x + box.w / 2 - (PET_W * px) / 2, y = box.y + 30 + hop;
  const def = PETS.find((p) => p.id === g.reveal!.pet)!;
  const glow = Math.floor(frame / 6) % 2;
  return (
    <>
      <Dim w={FW} h={FH} />
      <Frame box={box} border={C.gold} />
      {[[560, 200], [1020, 260], [600, 520], [1040, 470], [800, 150]].map(([sx, sy], i) => ((i + glow) % 2 ? <Pixels key={i} rects={[rect(4, 0, 4, 12, C.goldLight), rect(0, 4, 12, 4, C.goldLight)]} px={2} x={sx} y={sy} /> : null))}
      <Pixels rects={silhouetteRects(def.id)} px={px} x={x} y={y} opacity={1 - k} w={PET_W} h={PET_H} />
      <Pixels rects={petRects(def.id, a >= 60 && a < 90 ? "up" : "mid", a >= 60 ? "happy" : "open", { hat: null, body: null, acc: null })} px={px} x={x} y={y} opacity={k} w={PET_W} h={PET_H} />
      {a >= 60 ? (
        <>
          <Label s={t(L, "newPet")} px={4} x={box.x + box.w / 2} y={box.y + 450} align="center" color={C.gold} />
          <Label s={t(L, def.name)} px={8} x={box.x + box.w / 2} y={box.y + 510} align="center" />
          <WrapLabel s={t(L, def.ability)} px={3} x={box.x + box.w / 2} y={box.y + 600} maxW={box.w - 60} color={UI.dim} />
        </>
      ) : null}
    </>
  );
}
