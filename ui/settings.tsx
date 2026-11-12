// The settings: auto save, sound and language, each a row you click to switch.
import { C } from "../art";
import type { Game } from "../game";
import { t } from "../i18n";
import { FH, FW, LANG_EN, LANG_KO, LANG_ROW, SET_PANEL, SET_ROW, SOUND_ROW, type Box } from "../layout";
import { Dim, FitIcon, Frame, Label, PixelButton, Pixels, UI, over, rect } from "./pixels";

export function GearButton({ g, box }: { g: Game; box: Box }) {
  return (
    <PixelButton g={g} box={box} fill={g.settings ? ["#ffcf4a", "#ffe07a"] : ["#c9c2e0", "#e2ddf0"]} shade={g.settings ? "#d9962a" : "#8f86b3"}>
      {(dy) => <FitIcon name="gear" box={52} x={box.x + 24} y={box.y + 16 + dy} />}
    </PixelButton>
  );
}

/** one setting: an icon (or a word), its name, a switch showing its value, and what it means now under it */
function Row({ g, r, iconName, word, label, on, value, says, warn = !on }: {
  g: Game; r: Box; iconName?: string; word?: string; label: string; on: boolean; value: string; says: string; warn?: boolean;
}) {
  const sw = { x: r.x + r.w - 236, y: r.y + 18, w: 216, h: 64 };
  const knob = on ? sw.w - 64 : 8;
  const textX = on ? sw.x + (sw.w - 64) / 2 + 2 : sw.x + 64 + (sw.w - 64) / 2 - 2;
  return (
    <>
      <Pixels rects={[rect(0, 0, r.w, r.h, over(g, r) ? UI.rowHover : UI.row), rect(0, r.h - 6, r.w, 6, UI.rowShadow)]} px={1} x={r.x} y={r.y} />
      {iconName ? <FitIcon name={iconName} box={52} x={r.x + 20} y={r.y + 22} /> : <Label s={word ?? ""} px={4} x={r.x + 46} y={r.y + 36} align="center" color={C.gold} />}
      <Label s={label} px={4} x={r.x + 92} y={r.y + 36} />
      <Pixels rects={[rect(0, 0, sw.w, sw.h, C.ink), rect(4, 4, sw.w - 8, sw.h - 8, on ? UI.ok : UI.off), rect(knob, 8, 56, 48, C.white), rect(knob, 48, 56, 8, "#c9c2e0")]} px={1} x={sw.x} y={sw.y} />
      <Label s={value} px={value.length > 4 ? 3 : 4} x={textX} y={sw.y + (value.length > 4 ? 22 : 18)} align="center" />
      <Label s={says} px={3} x={r.x + r.w / 2} y={r.y + r.h + 14} color={warn ? UI.poor : UI.dim} align="center" />
    </>
  );
}

/** the language: both choices shown as tabs, the picked one lit */
function LangRow({ g }: { g: Game }) {
  const L = g.set.lang, r = LANG_ROW;
  const tab = (b: Box, lang: "ko" | "en", word: string) => {
    const on = L === lang, hot = over(g, b);
    return (
      <>
        <Pixels rects={[rect(0, 0, b.w, b.h, C.ink), rect(4, 4, b.w - 8, b.h - 8, on ? "#ffcf4a" : hot ? "#5a5285" : UI.off), rect(4, b.h - 12, b.w - 8, 8, on ? "#d9962a" : UI.offDark)]} px={1} x={b.x} y={b.y} />
        <Label s={word} px={word.length > 4 ? 3 : 4} x={b.x + b.w / 2} y={b.y + (word.length > 4 ? 24 : 20)} align="center" color={on ? C.ink : UI.faint} shadow={!on} />
      </>
    );
  };
  return (
    <>
      <Pixels rects={[rect(0, 0, r.w, r.h, UI.row), rect(0, r.h - 6, r.w, 6, UI.rowShadow)]} px={1} x={r.x} y={r.y} />
      <Label s="A가" px={4} x={r.x + 46} y={r.y + 36} align="center" color={C.gold} />
      <Label s={t(L, "language")} px={4} x={r.x + 92} y={r.y + 36} />
      {tab(LANG_KO, "ko", "한국어")}
      {tab(LANG_EN, "en", "ENGLISH")}
      <Label s={t(L, "language.now")} px={3} x={r.x + r.w / 2} y={r.y + r.h + 14} color={UI.dim} align="center" />
    </>
  );
}

export function Settings({ g }: { g: Game }) {
  const L = g.set.lang;
  const onOff = (v: boolean) => t(L, v ? "switchOn" : "switchOff");
  return (
    <>
      <Dim w={FW} h={FH} />
      <Frame box={SET_PANEL} border={C.gold} />
      <FitIcon name="gear" box={56} x={SET_PANEL.x + 36} y={SET_PANEL.y + 26} />
      <Label s={t(L, "settings")} px={6} x={SET_PANEL.x + 112} y={SET_PANEL.y + 34} color={C.gold} />
      <Row g={g} r={SET_ROW} iconName="disk" label={t(L, "autoSave")} on={g.set.autosave} value={onOff(g.set.autosave)} says={t(L, g.set.autosave ? "autoSave.on" : "autoSave.off")} />
      <Row g={g} r={SOUND_ROW} iconName={g.set.sound ? "sound" : "mute"} label={t(L, "sound")} on={g.set.sound} value={onOff(g.set.sound)} says={t(L, g.set.sound ? "sound.on" : "sound.off")} />
      <LangRow g={g} />
    </>
  );
}
