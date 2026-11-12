// The play screen's parts: the HUD, the buttons along the top, the SHOP (the pet's own tools), the CLOSET, the
// question after a save, what floats up, the SAVED note and the demo's cursor.
import { memo } from "react";
import { C, fmt, fmtRate, textWidth } from "../art";
import { SUN_FRAMES, type Lang } from "../state";
import { canDress, canUpgrade, pickedItem, type Game } from "../game";
import { t } from "../i18n";
import { ITEMS } from "../items";
import { ASK, ASK_HOME, ASK_STAY, BUY_BAR, CLOSET_BTN, FH, FW, GEAR_PLAY, GROUND, SAVE_BTN, SHOP_BTN, panelBox, rowBox, type Box } from "../layout";
import { perSecond, petOf, tapBase } from "../pets";
import { Badge, Dim, FitIcon, Frame, Icon, Label, PixelButton, Pixels, UI, onFours, onTwos, over, rect, textW } from "./pixels";
import { GearButton } from "./settings";

export function Hud({ g, frame }: { g: Game; frame: number }) {
  const def = petOf(g.p.pet);
  return (
    <HudView lang={g.set.lang} coins={fmt(g.p.coins)} perSec={`+${fmtRate(perSecond(g.p))}`} perTap={`+${fmtRate(tapBase(g.p))}`}
      secIcon={def.tools[0].icon} tapIcon={def.tools[1].icon} sun={g.acc.sun} style={`${g.p.owned.length}/${ITEMS.length}`}
      day={Math.floor((g.acc.sunFrames / SUN_FRAMES) * DAY_W)} bump={onTwos(frame) - g.tapT >= 0 && onTwos(frame) - g.tapT < 6} />
  );
}

/** how far the day has come toward the next sunlight, beside the sunlight count */
const DAY_W = 110;

/** the HUD as it reads: drawn again only when a number on it changes */
const HudView = memo(function HudView({ lang: L, coins, perSec, perTap, secIcon, tapIcon, sun, style, day, bump }: {
  lang: Lang; coins: string; perSec: string; perTap: string; secIcon: string; tapIcon: string; sun: number; style: string; day: number; bump: boolean;
}) {
  const cells = [
    { x: 60, icon: "coin", label: t(L, "hud.coins"), value: coins, color: C.gold },
    { x: 440, icon: secIcon, label: t(L, "hud.perSec"), value: perSec, color: C.white },
    { x: 820, icon: tapIcon, label: t(L, "hud.perTap"), value: perTap, color: C.white },
    { x: 1200, icon: "sun", label: t(L, "hud.sun"), value: String(sun), color: C.gold },
    { x: 1580, icon: "tee", label: t(L, "hud.style"), value: style, color: C.white },
  ];
  const barX = 1200 + 84 + textWidth(String(sun), 7) + 20;
  return (
    <>
      {cells.map((c, i) => (
        <span key={i}>
          <FitIcon name={c.icon} box={64} x={c.x} y={44} />
          <Label s={c.label} px={3} x={c.x + 84} y={28} color={UI.faint} />
          <Label s={c.value} px={i === 0 && bump ? 8 : 7} x={c.x + 84} y={i === 0 && bump ? 56 : 60} color={c.color} />
        </span>
      ))}
      <Pixels rects={[rect(0, 0, DAY_W + 8, 22, C.ink), rect(4, 4, DAY_W, 14, UI.off), rect(4, 4, day, 14, C.gold)]} px={1} x={barX} y={76} />
    </>
  );
});

export function Hints({ g }: { g: Game }) {
  const L = g.set.lang;
  const key = g.settings ? "hint.settings"
    : g.phase === "home" ? (g.homeView === "pets" ? "hint.pets" : g.homeView === "pick" ? "hint.pick" : g.homeView === "main" ? "hint.home" : "hint.slots")
    : g.ask ? "hint.ask" : g.panel === "closet" ? "hint.closet" : "hint.play";
  return <Label s={t(L, key)} px={3} x={960} y={30} color={UI.faint} align="center" />;
}

export function TopButtons({ g, frame }: { g: Game; frame: number }) {
  const L = g.set.lang;
  const tab = (box: Box, panel: "shop" | "closet", label: string, iconName: string, badge: boolean) => {
    const open = g.panel === panel;
    return (
      <>
        <PixelButton g={g} box={box} fill={open ? ["#ff6b6b", "#ff8a8a"] : ["#ffcf4a", "#ffe07a"]} shade={open ? "#c94a4a" : "#d9962a"}>
          {(dy) => (
            <>
              <FitIcon name={iconName} box={60} x={box.x + 12} y={box.y + 12 + dy} />
              <Label s={open ? t(L, "close") : label} px={4} x={box.x + 80} y={box.y + 30 + dy} color={C.ink} shadow={false} />
            </>
          )}
        </PixelButton>
        {badge && !open ? <Badge x={box.x + box.w - 22} y={box.y - 14} frame={frame - (frame % 10)} /> : null}
      </>
    );
  };
  return (
    <>
      {g.ask ? (
        <PixelButton g={g} box={SAVE_BTN} fill={[UI.ok, UI.ok]} shade={UI.okDark}>
          {(dy) => <FitIcon name="check" box={52} x={SAVE_BTN.x + 24} y={SAVE_BTN.y + 16 + dy} />}
        </PixelButton>
      ) : (
        <PixelButton g={g} box={SAVE_BTN} fill={["#8fd3ff", "#b5e3ff"]} shade="#4a9fd9">
          {(dy) => <FitIcon name="disk" box={52} x={SAVE_BTN.x + 24} y={SAVE_BTN.y + 16 + dy} />}
        </PixelButton>
      )}
      <GearButton g={g} box={GEAR_PLAY} />
      {tab(CLOSET_BTN, "closet", t(L, "closet"), "tee", canDress(g.p))}
      {tab(SHOP_BTN, "shop", t(L, "shop"), petOf(g.p.pet).tools[0].icon, canUpgrade(g.p))}
    </>
  );
}

/** a row's ground: worn, hovered, flashing for the last press, shaking when it failed */
function RowGround({ g, frame, panel, i, worn, picked }: { g: Game; frame: number; panel: "shop" | "closet"; i: number; worn?: boolean; picked?: boolean }) {
  const b = rowBox(i);
  const hot = over(g, b);
  const note = g.note && g.note.panel === panel && g.note.row === i ? frame - g.note.t : -1;
  let bg = worn ? (hot ? UI.wornHover : UI.worn) : hot ? UI.rowHover : UI.row;
  if (note >= 0 && note < 14) bg = g.note!.ok ? UI.ok : UI.bad;
  const shake = note >= 0 && note < 12 && !g.note!.ok ? (note % 4 < 2 ? -6 : 6) : 0;
  const rects = [rect(0, 0, b.w, b.h, bg), rect(0, b.h - 6, b.w, 6, UI.rowShadow), rect(10, 10, 64, 64, UI.well)];
  if (picked) rects.push(rect(0, 0, b.w, 4, C.gold), rect(0, b.h - 4, b.w, 4, C.gold), rect(0, 0, 4, b.h, C.gold), rect(b.w - 4, 0, 4, b.h, C.gold));
  return { x: b.x + shake, y: b.y, w: b.w, el: <Pixels rects={rects} px={1} x={b.x + shake} y={b.y} /> };
}

/** a price at a row's top right: the coin, then the number */
function Price({ n, can, right, y }: { n: number; can: boolean; right: number; y: number }) {
  const s = fmt(n);
  return (
    <>
      <Icon name="coin" px={3} x={right - textWidth(s, 4) - 40} y={y - 2} />
      <Label s={s} px={4} x={right} y={y} color={can ? UI.price : UI.poor} align="right" />
    </>
  );
}

export function Shop({ g, frame }: { g: Game; frame: number }) {
  const L = g.set.lang;
  const def = petOf(g.p.pet);
  return (
    <>
      <Frame box={panelBox("shop")} />
      {def.tools.map((tool, i) => {
        const lv = g.p.tools[i];
        const cost = tool.cost(lv);
        const unit = t(L, tool.kind === "sec" ? "unit.sec" : "unit.tap");
        const mult = tool.kind === "sec" ? def.mult.sec : def.mult.tap;
        const r = RowGround({ g, frame, panel: "shop", i });
        return (
          <span key={tool.icon}>
            {r.el}
            <FitIcon name={tool.icon} box={60} x={r.x + 12} y={r.y + 12} />
            <Label s={t(L, tool.name)} px={textW(t(L, tool.name), 4) <= r.w - 16 - textWidth(fmt(cost), 4) - 48 - 90 ? 4 : 3} x={r.x + 90} y={r.y + 14} />
            <Label s={`${t(L, "lv", { n: lv + 1 })}  +${fmtRate(tool.value(lv) * mult)} > +${fmtRate(tool.value(lv + 1) * mult)}${unit}`} px={3} x={r.x + 90} y={r.y + 52} color={UI.dim} />
            <Price n={cost} can={g.p.coins >= cost} right={r.x + r.w - 16} y={r.y + 16} />
          </span>
        );
      })}
    </>
  );
}

export function Closet({ g, frame }: { g: Game; frame: number }) {
  const L = g.set.lang;
  const picked = pickedItem(g);
  const bar = BUY_BAR;
  const barNote = g.note && g.note.panel === "closet" && g.note.row === ITEMS.length ? frame - g.note.t : -1;
  const shake = barNote >= 0 && barNote < 12 && !g.note!.ok ? (barNote % 4 < 2 ? -6 : 6) : 0;
  const can = !!picked && g.p.coins >= picked.price;
  return (
    <>
      <Frame box={panelBox("closet")} />
      {ITEMS.map((it, i) => {
        const owned = g.p.owned.includes(it.id);
        const worn = g.p.wear[it.slot] === it.id;
        const isPick = g.pick === it.id;
        const r = RowGround({ g, frame, panel: "closet", i, worn, picked: isPick });
        const sub = isPick ? t(L, "trying") : worn ? t(L, "wearing") : owned ? t(L, "owned") : t(L, `slot.${it.slot}` as const);
        return (
          <span key={it.id}>
            {r.el}
            <FitIcon name={it.id} box={60} x={r.x + 12} y={r.y + 12} />
            <Label s={t(L, it.name)} px={4} x={r.x + 90} y={r.y + 14} />
            <Label s={sub} px={3} x={r.x + 90} y={r.y + 52} color={isPick ? C.gold : worn ? "#9cf0b8" : UI.dim} />
            {owned ? (
              <>
                <Pixels rects={[rect(0, 0, 84, 40, C.ink), rect(4, 4, 76, 32, worn ? UI.ok : "#5a4a8a")]} px={1} x={r.x + r.w - 100} y={r.y + 12} />
                <Label s={t(L, worn ? "on" : "off")} px={4} x={r.x + r.w - 58} y={r.y + 18} align="center" />
              </>
            ) : (
              <Price n={it.price} can={g.p.coins >= it.price} right={r.x + r.w - 16} y={r.y + 16} />
            )}
          </span>
        );
      })}
      {!picked ? (
        <Label s={t(L, "tryHint")} px={3} x={bar.x + bar.w / 2} y={bar.y + 32} color={UI.faint} align="center" />
      ) : (
        <PixelButton g={g} box={bar} dx={shake} fill={can ? [UI.ok, "#7ad99a"] : [UI.off, "#5a5285"]} shade={can ? UI.okDark : UI.offDark}>
          {(dy) => can ? (
            <>
              <Label s={t(L, "buy")} px={5} x={bar.x + shake + 150} y={bar.y + 22 + dy} />
              <Icon name="coin" px={4} x={bar.x + shake + 260} y={bar.y + 16 + dy} />
              <Label s={fmt(picked.price)} px={5} x={bar.x + shake + 310} y={bar.y + 22 + dy} color={C.gold} />
            </>
          ) : (
            <Label s={t(L, "needMore", { n: fmt(Math.ceil(picked.price - g.p.coins)) })} px={4} x={bar.x + shake + bar.w / 2} y={bar.y + 26 + dy} color={UI.poor} align="center" />
          )}
        </PixelButton>
      )}
    </>
  );
}

/** after a save: go home, or keep playing */
export function Ask({ g }: { g: Game }) {
  const L = g.set.lang;
  const a = ASK;
  return (
    <>
      <Dim w={FW} h={FH} />
      <Frame box={a} border={C.gold} />
      <Icon name="disk" px={5} x={a.x + 196} y={a.y + 34} />
      <Label s={t(L, "savedBang")} px={7} x={a.x + 270} y={a.y + 36} color={C.gold} />
      <Label s={t(L, "goHome")} px={3} x={a.x + a.w / 2} y={a.y + 122} align="center" />
      <PixelButton g={g} box={ASK_HOME} fill={[UI.ok, "#7ad99a"]} shade={UI.okDark}>
        {(dy) => (
          <>
            <FitIcon name="house" box={48} x={ASK_HOME.x + 30} y={ASK_HOME.y + 18 + dy} />
            <Label s={t(L, "home")} px={5} x={ASK_HOME.x + 96} y={ASK_HOME.y + 26 + dy} />
          </>
        )}
      </PixelButton>
      <PixelButton g={g} box={ASK_STAY} fill={["#ffcf4a", "#ffe07a"]} shade="#d9962a">
        {(dy) => <Label s={t(L, "keepPlaying")} px={4} x={ASK_STAY.x + ASK_STAY.w / 2} y={ASK_STAY.y + 30 + dy} color={C.ink} align="center" shadow={false} />}
      </PixelButton>
    </>
  );
}

/** what floats up: +N from a tap (big and gold for a jackpot), the second's coins, coin chips */
export function Pops({ g, frame }: { g: Game; frame: number }) {
  const L = g.set.lang;
  return (
    <>
      {g.chips.map((c, i) => {
        const a = onTwos(frame) - c.t;
        if (a < 0 || a > 40) return null;
        const y = c.y + c.vy * a + 0.45 * a * a;
        if (y > GROUND) return null;
        return <Icon key={"c" + c.t + i} name="coin" px={2} x={Math.round(c.x + c.vx * a - 10)} y={Math.round(y - 10)} />;
      })}
      {g.pops.map((p, i) => {
        if (p.idle) {
          const a = onFours(frame) - p.t;
          if (a < 0 || a > 60) return null;
          const o = a < 40 ? 1 : 1 - (a - 40) / 20;
          const y = Math.round(p.y - a * 0.9);
          return (
            <span key={"i" + p.t}>
              <Icon name="coin" px={3} x={p.x - 70} y={y - 4} opacity={o} />
              <Label s={`+${fmtRate(p.n)}`} px={3} x={p.x - 32} y={y} color={C.goldLight} opacity={o} />
            </span>
          );
        }
        const a = onTwos(frame) - p.t;
        if (a < 0 || a > 45) return null;
        const o = a < 30 ? 1 : 1 - (a - 30) / 15;
        return (
          <span key={"p" + p.t + i}>
            <Label s={`+${fmtRate(p.n)}`} px={p.big ? (a < 6 ? 9 : 8) : a < 4 ? 6 : 5} x={p.x} y={Math.round(p.y - a * 2)} color={p.big ? "#ffe66b" : C.gold} align="center" opacity={o} />
            {p.big ? <Label s={t(L, "jackpot")} px={4} x={p.x} y={Math.round(p.y - 50 - a * 2)} color="#ff8fab" align="center" opacity={o} /> : null}
          </span>
        );
      })}
    </>
  );
}

export function Saved({ g, frame }: { g: Game; frame: number }) {
  const a = frame - g.saveT;
  if (a < 0 || a > 75) return null;
  const o = a < 55 ? 1 : 1 - (a - 55) / 20;
  return (
    <>
      <Icon name="disk" px={4} x={24} y={842} opacity={o} />
      <Label s={t(g.set.lang, "saved")} px={4} x={74} y={850} opacity={o} />
    </>
  );
}

export function DoneBanner({ g }: { g: Game }) {
  const L = g.set.lang;
  return (
    <div style={{ position: "relative", width: 900, height: 170 }}>
      <Pixels rects={[rect(0, 0, 900, 170, C.ink), rect(6, 6, 888, 158, "#ffcf4a"), rect(12, 12, 876, 146, "#2b2147")]} px={1} x={0} y={0} />
      <Label s={t(L, "doneTitle")} px={7} x={450} y={40} color={C.gold} align="center" />
      <Label s={t(L, "doneSub")} px={3} x={450} y={112} color={UI.dim} align="center" />
    </div>
  );
}

export function Cursor({ g }: { g: Game }) {
  if (!g.cursor) return null;
  const { x, y, down } = g.cursor;
  return (
    <>
      {down ? <Pixels rects={[rect(0, 16, 8, 8, C.white), rect(32, 16, 8, 8, C.white), rect(16, 0, 8, 8, C.white), rect(16, 32, 8, 8, C.white)]} px={1} x={x - 20} y={y - 20} /> : null}
      <Icon name="arrow" px={4} x={Math.round(x) - 4} y={Math.round(y) - 4 + (down ? 2 : 0)} />
    </>
  );
}

/** a new day: a sunlight came */
export function SunBanner({ g }: { g: Game }) {
  const L = g.set.lang;
  return (
    <div style={{ position: "relative", width: 900, height: 190 }}>
      <Pixels rects={[rect(0, 0, 900, 190, C.ink), rect(6, 6, 888, 178, "#ffcf4a"), rect(12, 12, 876, 166, "#2b2147")]} px={1} x={0} y={0} />
      <FitIcon name="sun" box={90} x={60} y={50} />
      <Label s={t(L, "sunGain")} px={8} x={490} y={44} color={C.gold} align="center" />
      <Label s={t(L, "sunGainSub")} px={3} x={490} y={130} color={UI.dim} align="center" />
    </div>
  );
}
