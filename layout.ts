// Where everything is, in field units (the field is 1600x900; raea/arena scales it whole into the stage).
import { ITEMS } from "./items";

export const FW = 1600, FH = 900;
export const GROUND = 720;

// raea/arena's placement of the field on a 1920x1080 stage, so a pointer in composition px lands in field units
const SW = 1920, SH = 1080;
const BAND_TOP = 0.13 * SH, BAND_BOTTOM = 0.08 * SH, GAP = 0.015 * SH;
const ROOM_W = SW * 0.96, ROOM_H = SH - BAND_TOP - BAND_BOTTOM - 2 * GAP;
export const SCALE = Math.min(ROOM_W / FW, ROOM_H / FH);
export const OX = (SW - FW * SCALE) / 2, OY = BAND_TOP + GAP + (ROOM_H - FH * SCALE) / 2;
export const toField = (p: { x: number; y: number }) => ({ x: (p.x - OX) / SCALE, y: (p.y - OY) / SCALE });
export const toStage = (p: { x: number; y: number }) => ({ x: OX + p.x * SCALE, y: OY + p.y * SCALE });

export interface Box { x: number; y: number; w: number; h: number }
export const inside = (b: Box, x: number, y: number) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;
const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

// ---- play ----
export const PET_BOX = box(630, 420, 340, 310);
/** the pet's tap box where it stands now (it walks left and right) */
export const petBoxAt = (x: number): Box => box(x - 170, PET_BOX.y, PET_BOX.w, PET_BOX.h);
/** how far the pet may walk, and how fast (field units a frame) */
export const WALK = { min: 180, max: 1420, speed: 7 };
export const PET_CENTER = { x: 800, y: 560 };
export const SAVE_BTN = box(24, 28, 100, 92);
export const GEAR_PLAY = box(136, 28, 100, 92);
export const CLOSET_BTN = box(1090, 28, 232, 92);
export const SHOP_BTN = box(1340, 28, 232, 92);
/** after a save: go home, or keep playing */
export const ASK = box(440, 150, 720, 300);
export const ASK_HOME = box(480, 330, 260, 92);
export const ASK_STAY = box(780, 330, 340, 92);
const PANEL_TOP = 134;
export const panelBox = (panel: "shop" | "closet"): Box =>
  box(1030, PANEL_TOP, 542, panel === "shop" ? 24 + 3 * 90 - 6 : 24 + (ITEMS.length + 1) * 90 - 6);
export const rowBox = (i: number): Box => box(1042, PANEL_TOP + 12 + i * 90, 518, 84);
export const BUY_BAR = rowBox(ITEMS.length);

// ---- settings (both screens) ----
export const GEAR_HOME = box(24, 28, 100, 92);
export const SET_PANEL = box(440, 30, 720, 750);
export const SET_ROW = box(476, 126, 648, 100);
export const SOUND_ROW = box(476, 280, 648, 100);
export const BGM_ROW = box(476, 434, 648, 100);
export const LANG_ROW = box(476, 588, 648, 100);
/** the language: two tabs side by side, the one picked lit */
export const LANG_KO = box(LANG_ROW.x + LANG_ROW.w - 356, LANG_ROW.y + 16, 164, 68);
export const LANG_EN = box(LANG_ROW.x + LANG_ROW.w - 184, LANG_ROW.y + 16, 164, 68);

// ---- home ----
export const PETS_BTN = box(1340, 28, 232, 92);
/** the home screen's two buttons, stacked over the pet: continue first, a new game under it */
export const CONTINUE_BTN = box(590, 92, 420, 96);
export const NEW_BTN = box(590, 246, 420, 96);
/** the slots, in a box that opens from either button */
export const SLOTS_PANEL = box(100, 110, 1400, 380);
const card = (i: number) => box(130 + i * 460, 190, 420, 270);
export const SLOT_CARDS: [Box, Box, Box] = [card(0), card(1), card(2)];
export const SLOT_DELETE: [Box, Box, Box] = SLOT_CARDS.map((c) => box(c.x + c.w - 68, c.y + 14, 54, 54)) as [Box, Box, Box];
/** the pets: four cards in a panel, each with its button (BUY, or PICK when choosing a slot's pet) */
export const PETS_PANEL = box(100, 110, 1400, 740);
const petCardBox = (i: number) => box(130 + i * 340, 190, 320, 630);
export const PET_CARDS: [Box, Box, Box, Box] = [petCardBox(0), petCardBox(1), petCardBox(2), petCardBox(3)];
export const PET_BUY: [Box, Box, Box, Box] = PET_CARDS.map((c) => box(c.x + 24, c.y + c.h - 104, c.w - 48, 84)) as [Box, Box, Box, Box];
/** asking before a slot is deleted */
export const DEL_PANEL = box(440, 180, 720, 330);
export const DEL_OK = box(480, 390, 300, 92);
export const DEL_CANCEL = box(820, 390, 300, 92);
