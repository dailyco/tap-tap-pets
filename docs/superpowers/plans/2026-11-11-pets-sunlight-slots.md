# 펫 수집 · 태양빛 · 저장 슬롯 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 고양이로 시작해 태양빛(플레이 20분마다 +1)으로 실루엣 펫 3마리를 사고, 펫마다 다른 능력·도구로 저장 슬롯 3개에서 따로 키우며, 한국어/영어를 고를 수 있게 한다.

**Architecture:** 게임 상태는 지금처럼 `useGameState(initial, step)` 순수 fold 하나다. 디스크는 첫 live 프레임에 한 번 읽고(`pending`), 쓰기는 view의 effect가 카운터(saveN/accN/setN/delN) 변화를 보고 한다. 로직(state/pets/i18n/game)과 그림(petArt)과 화면(ui/*)을 파일로 나눠 각 파일이 한 가지만 맡는다.

**Tech Stack:** raea (React on Bevy, TypeScript), bun test(순수 로직), raea render/play/check/export-game, SQLite(`__raea_call("sqlite.exec")`).

**Spec:** `docs/superpowers/specs/2026-11-11-pets-sunlight-slots-design.md`

## Global Constraints

- 모든 명령은 프로젝트 폴더 `~/raea/games/projects/pixel-pet` 에서. raea 실행 파일: `R=/Users/sarah/Development/dailyco/raea/target/release/raea`.
- 순수 로직 테스트: `bun test tests/<file>.test.ts`. 게임 모듈은 `raea` 를 타입으로만 import 한다(bun에서 돌아가야 한다).
- `step` 은 순수하다. `Math.random`·`Date.now` 금지. 난수는 프레임 해시(`hash(n)`)로.
- 디스크는 live 프레임에서만 반영·기록한다. 렌더(비라이브)는 디스크에 따라 달라지면 안 된다.
- 스크립트 live 입력 렌더로 저장을 시험할 때는 **항상** `HOME=<스크래치 폴더>` 로 실행해 사용자의 실제 세이브(`~/Library/Application Support/pixel-pet-save.db`)를 건드리지 않는다. 입력 로그 형식: `{"<frame>": {"keys": [], "live": true, "pointer": {"x", "y", "down"}}}` (composition px; 필드 → 스테이지: `x = 230.4 + fx*0.912`, `y = 156.6 + fy*0.912`).
- 효과음·폰트 등 파일 경로는 `staticFile("sfx/x.wav")` 처럼 문자열 그대로 쓴다(export-game이 찾는다).
- 값(스펙 그대로): 태양빛 `SUN_FRAMES = 72_000`(60fps × 20분). 펫 가격 우파 3, 뭉게 5, 모찌룡 8(고양이 0, 처음부터 보유). 능력: 고양이 탭 ×1.5, 우파 탭 10%로 ×5, 뭉게 초당 ×1.5, 모찌룡 초당·탭 ×1.25. 도구 곡선: 초당 값 `1 + lv(lv+1)/2`, 비용 `round(20·1.8^lv)`; 탭 값 `1 + lv`, 비용 `round(15·1.7^lv)`.
- 저장 규칙(스펙 그대로): 슬롯은 자동 저장 ON일 때 10초마다·구매/업그레이드/착용 때, 💾·홈 갈 때·새 게임 때는 항상. 태양빛은 얻는 순간 저장. 계정(태양빛+쌓인 시간)은 자동 저장 설정과 무관하게 플레이 600프레임마다와 홈 갈 때도 저장. 펫 구매는 즉시 계정 저장.
- 코인은 소수 허용(능력 배율 때문). 코인 표시는 내림, 비율 표시(+1.5/S)는 소수 한 자리.
- 커밋은 사용자가 요청할 때만. 각 Task 끝은 "체크포인트"(테스트·렌더 통과 확인)로 대신한다.

## Review Focus

1. 지금 쓰는 세이브(`main` 키: coins, earned, tools{pickaxe,gloves}, owned, wear)가 슬롯 1 고양이로 손실 없이 넘어온다. → Task 1 테스트.
2. 안 산 펫 카드는 이름 "???"과 단색 실루엣만 보이고 색·이름이 새지 않는다. → Task 4 테스트(`petCard`), Task 7 렌더 확인.
3. 태양빛은 플레이 화면에서만 흐른다. 홈·펫 패널·삭제 확인 중에는 멈추고, 플레이 중 설정창·저장 확인창이 떠 있어도 흐른다. → Task 5 테스트.
4. 두 언어 모두 최악값(코인 1.23M, 도구 LV10, "지느러미 박수", "TREASURE PILE", 능력 문구)에서 글자가 칸을 넘지 않는다. → Task 2 테스트(영문은 픽셀 폰트로 그릴 수 있음), Task 7·8 시트 렌더.
5. 슬롯이 3개 다 찼을 때 새 게임은 삭제 뒤에만 되고, 지운 슬롯은 빈 칸으로 돌아오며 다른 슬롯은 그대로다. → Task 4 테스트.

---

### Task 1: 상태 타입, 저장 키, 이전(migration)

**Files:**
- Create: `state.ts`
- Modify: `save.ts` (키 타입, `deleteSlot`)
- Test: `tests/state.test.ts`

**Interfaces:**
- Produces (`state.ts`): `type PetId = "cat" | "upa" | "mungge" | "mochi"`; `interface Wear { hat: string | null; body: string | null; acc: string | null }`; `interface SlotData { pet: PetId; coins: number; earned: number; tools: [number, number]; owned: string[]; wear: Wear; playFrames: number }`; `interface Account { sun: number; sunFrames: number; pets: PetId[] }`; `type Lang = "ko" | "en"`; `interface Settings { autosave: boolean; sound: boolean; lang: Lang }`; `SUN_FRAMES = 72_000`; `freshSlot(pet: PetId): SlotData`; `FRESH_ACCOUNT = { sun: 0, sunFrames: 0, pets: ["cat"] }`; `DEFAULT_SETTINGS = { autosave: true, sound: true, lang: "ko" }`; `checkSlot(raw: unknown): SlotData | null`; `checkAccount(raw: unknown): Account`; `checkSettings(raw: unknown): Settings`; `migrateMain(raw: unknown): SlotData | null`; `type Slots = [SlotData | null, SlotData | null, SlotData | null]`; `interface Loaded { account: Account; slots: Slots; settings: Settings; migrated: boolean }`; `loadFrom(read: (key: SaveKey) => unknown): Loaded`.
- Produces (`save.ts`): `type SaveKey = "main" | "account" | "settings" | "slot1" | "slot2" | "slot3"`; `readSlot(key: SaveKey): unknown`; `writeSlot(key: SaveKey, value: unknown): void`; `deleteSlot(key: SaveKey): void`; `readAll(): Loaded` (= `loadFrom(readSlot)`).

- [ ] **Step 1: 실패하는 테스트 작성** — `tests/state.test.ts`

```ts
test("old main save becomes a cat in slot 1", () => {
  const disk: Record<string, unknown> = { main: { coins: 84, earned: 300, tools: { pickaxe: 2, gloves: 1 }, owned: ["cap", "tee"], wear: { hat: "cap", body: "tee", acc: null } } };
  const l = loadFrom((k) => disk[k] ?? null);
  expect(l.migrated).toBe(true);
  expect(l.slots[0]).toEqual({ pet: "cat", coins: 84, earned: 300, tools: [2, 1], owned: ["cap", "tee"], wear: { hat: "cap", body: "tee", acc: null }, playFrames: 0 });
  expect(l.slots[1]).toBeNull(); expect(l.slots[2]).toBeNull();
  expect(l.account).toEqual(FRESH_ACCOUNT);
});
test("slots on disk win over main", () => { /* slot1 = freshSlot("upa") 저장돼 있고 main도 있음 → migrated false, slots[0].pet === "upa" */ });
test("broken data falls back", () => {
  expect(checkSlot({ pet: "dog" })).toBeNull();
  expect(checkAccount({ sun: -3, pets: ["mochi", "x"] })).toEqual({ sun: 0, sunFrames: 0, pets: ["cat", "mochi"] });
  expect(checkSettings({ lang: "fr", sound: false })).toEqual({ autosave: true, sound: false, lang: "ko" });
});
test("wear only keeps owned items in their slot", () => { /* owned ["cap"], wear {hat:"crown", body:"cap"} → wear {hat:null, body:null, acc:null} */ });
```

- [ ] **Step 2: 실패 확인** — `bun test tests/state.test.ts` → FAIL ("Cannot find module ../state")
- [ ] **Step 3: `state.ts` 구현, `save.ts` 에 `SaveKey`·`deleteSlot`(`DELETE FROM save WHERE slot = '<key>'`)·`readAll` 추가.** 기존 `readSave/writeSave` 는 지운다(`main` 은 읽기만, 백업으로 남김). 아이템 id·슬롯 검증 목록은 `items.ts`(Task 2에서 만듦)가 아직 없으니, 이 Task에서 `ITEMS`(id, slot, price — 지금 game.ts의 7개 그대로)를 `items.ts` 로 옮겨 만든다.
- [ ] **Step 4: 통과 확인** — `bun test tests/state.test.ts` → PASS
- [ ] **Step 5: 체크포인트**

### Task 2: 문자열 표(한국어/영어)와 픽셀 폰트 보강

**Files:**
- Create: `i18n.ts`
- Modify: `items.ts` (이름 키), `art.ts` (글리프 `%`, `,`, `'`, `(`, `)` 추가와 `canDraw(s: string): boolean`)
- Test: `tests/i18n.test.ts`

**Interfaces:**
- Consumes: `Lang` (Task 1).
- Produces: `STR: Record<string, { ko: string; en: string }>`; `type Key = keyof typeof STR`; `t(lang: Lang, key: Key, vars?: Record<string, string | number>): string` (`{n}` 같은 자리표시 치환); `canDraw(s)` = 대문자로 바꿨을 때 모든 글자가 5×7 폰트에 있음.
- 고정 문구(스펙): 펫 이름 `pet.cat` 고양이/KITTY, `pet.upa` 우파/UPA, `pet.mungge` 뭉게/MUNGGE, `pet.mochi` 모찌룡/MOCHIRYU. 능력 `ability.cat` "탭 코인 +50%"/"TAP COINS +50%", `ability.upa` "탭 10번 중 1번 대박 ×5"/"1 IN 10 TAPS: x5 JACKPOT", `ability.mungge` "초당 코인 +50%"/"COINS PER SEC +50%", `ability.mochi` "모든 코인 +25%"/"ALL COINS +25%". 도구 `tool.cat.sec` 장난감 낚싯대/TEASER WAND, `tool.cat.tap` 꾹꾹이/KNEAD PAWS, `tool.upa.sec` 물방울 펌프/BUBBLE PUMP, `tool.upa.tap` 지느러미 박수/FIN CLAP, `tool.mungge.sec` 구름 방석/CLOUD CUSHION, `tool.mungge.tap` 몽글 박치기/FLUFF BONK, `tool.mochi.sec` 보물 더미/TREASURE PILE, `tool.mochi.tap` 날갯짓/WING FLAP. 아이템 한국어: 리본, 야구모자, 왕관, 줄무늬 티, 영웅 망토, 선글라스, 목도리. 실루엣 이름 `pet.unknown` "???"/"???". 나머지 UI 문구(버튼, 안내 줄, 설정, 홈, 확인 창)는 지금 영어 문구를 키로 옮기고 한국어를 붙인다(빌더 재량).

- [ ] **Step 1: 실패하는 테스트**

```ts
test("every string has both languages", () => { for (const [k, v] of Object.entries(STR)) { expect(v.ko.length).toBeGreaterThan(0); expect(v.en.length).toBeGreaterThan(0); } });
test("english draws in the pixel font", () => { for (const v of Object.values(STR)) expect(canDraw(v.en)).toBe(true); });
test("vars fill in", () => { expect(t("en", "needMore", { n: 23 })).toBe("NEED 23 MORE"); expect(t("ko", "needMore", { n: 23 })).toBe("23 코인 부족"); });
test("fixed names", () => { expect(t("ko", "tool.upa.tap")).toBe("지느러미 박수"); expect(t("en", "pet.mochi")).toBe("MOCHIRYU"); });
```

- [ ] **Step 2: 실패 확인** — `bun test tests/i18n.test.ts` → FAIL
- [ ] **Step 3: `i18n.ts`, `canDraw`, 새 글리프 구현** (`×` 는 영문에서 `X` 로 쓴다)
- [ ] **Step 4: 통과 확인** — PASS
- [ ] **Step 5: 체크포인트**

### Task 3: 펫 카탈로그와 능력

**Files:**
- Create: `pets.ts`
- Modify: `art.ts` (`fmtRate(n: number): string` — 정수면 `fmt`, 아니면 소수 한 자리; `fmt` 는 내림)
- Test: `tests/pets.test.ts`

**Interfaces:**
- Consumes: `PetId`, `SlotData` (Task 1), `Key` (Task 2).
- Produces: `interface ToolDef { kind: "sec" | "tap"; name: Key; icon: string; value(lv: number): number; cost(lv: number): number }`; `interface PetDef { id: PetId; name: Key; ability: Key; price: number; tools: [ToolDef, ToolDef]; mult: { sec: number; tap: number }; jackpot: number }` (`jackpot` = 대박 확률, 우파만 0.1); `PETS: PetDef[]` (순서 cat, upa, mungge, mochi); `petOf(id: PetId): PetDef`; `hash(n: number): number` (지금 game.ts의 것을 옮김); `perSecond(s: SlotData): number`; `perTap(s: SlotData, frame: number): { coins: number; jackpot: boolean }`.

- [ ] **Step 1: 실패하는 테스트**

```ts
test("catalog", () => { expect(PETS.map((p) => p.id)).toEqual(["cat", "upa", "mungge", "mochi"]); expect(PETS.map((p) => p.price)).toEqual([0, 3, 5, 8]); });
test("abilities", () => {
  expect(perSecond(freshSlot("cat"))).toBe(1); expect(perSecond(freshSlot("mungge"))).toBe(1.5); expect(perSecond(freshSlot("mochi"))).toBe(1.25);
  expect(perSecond({ ...freshSlot("mungge"), tools: [2, 0] })).toBe(6);
  expect(perTap(freshSlot("cat"), 0).coins).toBe(1.5); expect(perTap(freshSlot("mochi"), 0).coins).toBe(1.25);
});
test("upa jackpot is about 1 in 10, x5, and the same every time", () => {
  let hits = 0; for (let f = 0; f < 10_000; f++) { const r = perTap(freshSlot("upa"), f); if (r.jackpot) { hits++; expect(r.coins).toBe(5); } else expect(r.coins).toBe(1); }
  expect(hits).toBeGreaterThan(800); expect(hits).toBeLessThan(1200);
  expect(perTap(freshSlot("upa"), 4242)).toEqual(perTap(freshSlot("upa"), 4242));
});
test("tool costs", () => { const t = petOf("cat").tools; expect([t[0].cost(0), t[0].cost(1), t[1].cost(0), t[1].cost(1)]).toEqual([20, 36, 15, 26]); });
test("rate text", () => { expect(fmtRate(1.5)).toBe("1.5"); expect(fmtRate(2)).toBe("2"); expect(fmt(84.9)).toBe("84"); });
```

- [ ] **Step 2: 실패 확인** — FAIL
- [ ] **Step 3: `pets.ts` 구현.** 도구 아이콘 이름은 `"tool-cat-sec"` 식으로 정해 두고 그림은 Task 6에서 만든다.
- [ ] **Step 4: 통과 확인** — PASS
- [ ] **Step 5: 체크포인트**

### Task 4: 게임 상태와 홈 화면 로직(슬롯, 펫 상점, 삭제, 설정)

**Files:**
- Create: `layout.ts` (지금 game.ts의 FW/FH/GROUND/`toField`/모든 Box를 옮기고 홈용 Box 추가)
- Modify: `game.ts` (상태·step 재구성)
- Test: `tests/home.test.ts`, `tests/drive.ts`(테스트 도우미)

**Interfaces:**
- Consumes: Task 1~3 전부.
- Produces (`layout.ts`): 기존 Box 전부 + `SLOT_CARDS: [Box, Box, Box]`, `SLOT_DELETE: [Box, Box, Box]`, `PETS_BTN`, `PETS_PANEL`, `PET_CARDS: [Box, Box, Box, Box]`, `PET_BUY: [Box, Box, Box, Box]`, `DEL_OK`, `DEL_CANCEL`, `LANG_ROW` (위치는 빌더 재량, 서로 겹치지 않게; 홈의 펫은 지금처럼 가운데 아래).
- Produces (`game.ts`):
  - `interface Game` — 지금 필드 중 화면용(`panel, pick, ask, settings, down, keys, cursor, human, tapT, pops, chips, note, doneT, manualT, saveT, soundT` 과 소리 카운터들)은 유지, `p`는 `SlotData`로 바뀜, 그리고 `slots: Slots; cur: number | null; acc: Account; set: Settings; pending: Loaded | null; homeView: "slots" | "pets" | "pick" | "delete"; target: number | null; reveal: { pet: PetId; t: number } | null; sunT: number; saveN: number; accN: number; setN: number; delN: number; delSlot: number | null; migrated: boolean` 와 카운터 `suns, adopts, deletes`. `hasSave, loaded, sureT, autosave, sound` 필드와 `SAVED*` 상수는 없앤다(설정은 `set` 으로).
  - `makeInitial(loaded: Loaded | null): Game` — `pending = loaded`, 첫 live 프레임에 `slots/acc/set/migrated` 로 들어가고 `pending = null`. `INITIAL = makeInitial(readAll())`.
  - `step(g: Game, input: FrameInput, frame: number): Game`.
  - `petCard(acc: Account, pet: PetId): { name: Key; owned: boolean; price: number; canBuy: boolean }` — 미보유면 `name = "pet.unknown"`.
  - `slotSummary(s: SlotData | null): { pet: PetId; coins: number; style: number; minutes: number } | null`.
- 동작: 찬 슬롯 카드 클릭 → 이어 하기(`cur`, `p = slots[i]`). 빈 슬롯 클릭 → `homeView "pick"`, 보유 펫 카드 클릭 → 그 펫으로 새 게임(`saveN++`). 삭제 버튼 → `homeView "delete"` → 확인 시 `slots[i] = null`, `delN++`, `delSlot = i`; 취소 시 그대로. PETS → `homeView "pets"`, BUY(태양빛 충분·미보유) → `acc.sun -= price`, `acc.pets` 에 추가, `accN++`, `reveal = { pet, t }`, `adopts++`; 부족하면 `fails++`. 모달 바깥 클릭·Escape → `homeView "slots"`. 설정 창에 `LANG_ROW` 클릭 → `set.lang` 뒤집고 `setN++`. 키보드: 1·2·3 슬롯, `p` 펫, Escape 닫기.

- [ ] **Step 1: 테스트 도우미** — `tests/drive.ts`: `drive(g: Game, script: Record<number, { click?: Box | [number, number]; keys?: string[] }>, frames: number, from = 0): Game` (live 입력으로 step을 반복; 클릭은 4프레임 누름, 필드 좌표를 composition px로 바꿔 넣음).
- [ ] **Step 2: 실패하는 테스트** — `tests/home.test.ts`

```ts
const loaded = (over: Partial<Loaded> = {}): Loaded => ({ account: FRESH_ACCOUNT, slots: [null, null, null], settings: DEFAULT_SETTINGS, migrated: false, ...over });
test("continue a slot", () => { const g = drive(makeInitial(loaded({ slots: [{ ...freshSlot("cat"), coins: 84 }, null, null] })), { 5: { click: SLOT_CARDS[0] } }, 20); expect(g.phase).toBe("play"); expect(g.cur).toBe(0); expect(g.p.coins).toBe(84); });
test("empty slot: pick an owned pet, new game", () => { /* click SLOT_CARDS[1] → homeView "pick", target 1; click PET_CARDS[0] → phase play, cur 1, p = freshSlot("cat"), saveN 1; PET_CARDS[3](mochi, 미보유) 클릭은 무시 */ });
test("buy a pet with sunlight", () => { /* acc.sun 3: PETS_BTN → PET_BUY[1] → acc.sun 0, pets ["cat","upa"], accN 1, reveal.pet "upa"; acc.sun 2면 fails 1, 나머지 그대로 */ });
test("an unowned card hides its name", () => { expect(petCard(FRESH_ACCOUNT, "mochi").name).toBe("pet.unknown"); expect(petCard({ ...FRESH_ACCOUNT, pets: ["cat", "mochi"] }, "mochi").name).toBe("pet.mochi"); });
test("delete asks first", () => { /* SLOT_DELETE[0] → "delete"; DEL_CANCEL → slots 그대로; 다시 → DEL_OK → slots[0] null, delN 1, delSlot 0, slots[1] 그대로 */ });
test("three full slots: new game only after a delete", () => { /* 슬롯 3개 다 참: 어떤 카드도 "pick"으로 안 감; 삭제 뒤 빈 칸 클릭 → "pick" */ });
test("slots keep their own coins", () => { /* slot1 이어 하기, 탭 3번, 💾→HOME → slot2 새 게임 coins 0 → 홈 → slot1 이어 하기 coins 유지 */ });
test("language switch", () => { /* 설정 열고 LANG_ROW → set.lang "en", setN 1; 다시 → "ko", setN 2 */ });
test("disk only joins on a live frame", () => { /* 같은 makeInitial(loaded)에 live 없는 입력으로 30프레임 → g.slots 모두 null(데모 경로) */ });
```

- [ ] **Step 3: 실패 확인** — `bun test tests/home.test.ts` → FAIL
- [ ] **Step 4: `layout.ts` 분리와 `game.ts` 재구성 구현.** 지금 step의 플레이 쪽 동작(탭, 패널, 옷장 입어보기·구매, 💾·홈 확인 창, 바깥 클릭 닫기, 설정 창)은 그대로 살린다. 홈의 모든 모달이 열려 있는 동안 클릭은 그 모달만 받는다.
- [ ] **Step 5: 통과 확인** — `bun test` 전체 → PASS
- [ ] **Step 6: 체크포인트**

### Task 5: 플레이 로직 — 태양빛, 펫 도구, 능력

**Files:**
- Modify: `game.ts`
- Test: `tests/play.test.ts`

**Interfaces:**
- Consumes: `perSecond`, `perTap`, `petOf` (Task 3), Task 4의 `Game`.
- Produces: 플레이 step에서 매 프레임 `acc.sunFrames += 1`, `p.playFrames += 1`; `sunFrames >= SUN_FRAMES` 이면 `acc.sun += 1`, `sunFrames -= SUN_FRAMES`, `sunT = now`, `suns++`, `accN++`. 600프레임마다 `accN++`(설정 무관), 자동 저장 ON이면 `saveN++`. 1초마다 `p.coins += perSecond(p)`. 탭은 `perTap(p, now)`; 대박이면 팝업에 표시용 플래그(`Pop.big = true`). SHOP 행 i는 `petOf(p.pet).tools[i]`, 비용 `tools[i].cost(p.tools[i])`.

- [ ] **Step 1: 실패하는 테스트**

```ts
test("a sunlight every 72000 play frames", () => { /* slot1 이어 하기 후 입력 없이 72000프레임 → acc.sun 1, sunT 설정, accN 증가 */ });
test("no sunlight on the home screen or in its panels", () => { /* 홈에서 5000프레임(펫 패널 열린 상태 포함) → acc.sunFrames 0 */ });
test("it keeps flowing with settings or the save question open", () => { /* 플레이 중 설정 창 연 채 1000프레임 → sunFrames +1000 */ });
test("the timer survives going home", () => { /* 30000프레임 → 💾 → HOME → 이어 하기 → sunFrames 30000 */ });
test("account saves every 600 frames even with auto save off", () => { /* set.autosave false: 1200프레임 → accN 2, saveN 0 */ });
test("shop rows are the pet's tools", () => { /* mungge 슬롯 coins 20: s → 행0 클릭 → p.tools [1,0], coins 0; perSecond 3 */ });
test("upa jackpot taps", () => { /* hash(now) < 0.1 인 프레임을 찾아 그때 탭 → coins +5, pops 마지막 big true */ });
```

- [ ] **Step 2: 실패 확인** — FAIL
- [ ] **Step 3: 구현**
- [ ] **Step 4: 통과 확인** — `bun test` 전체 → PASS
- [ ] **Step 5: 체크포인트**

### Task 6: 펫 그림 엔진과 네 마리, 펫별 옷 입히기, 도구 아이콘

**Files:**
- Create: `petArt.ts` (도형 래스터 엔진: `out/concepts.tsx` 의 `draw` 를 옮기고 부위 id·포즈·앵커 추가), `petShapes.ts` (네 마리의 도형·얼굴·앵커)
- Modify: `art.ts` (옛 고양이 `pet()` 와 32×28 캔버스 삭제, 도구 아이콘 8개 + 해 아이콘 `sun` + 휴지통 `trash` 추가)
- Test: `tests/petArt.test.ts`, 확인용 `out/pet-sheet.tsx`

**Interfaces:**
- Consumes: `PetId`, `Wear` (Task 1).
- Produces: `PET_GRID = 40`; `type Pose = "mid" | "up" | "down" | "squash"`; `type Eyes = "open" | "blink" | "happy"`; `petRects(pet: PetId, pose: Pose, eyes: Eyes, wear: Wear): Rect[]`; `silhouetteRects(pet: PetId): Rect[]` (색 하나 `#120a20`); 결과는 인자별로 캐시(같은 인자 → 같은 배열).
- 그림 규칙(스펙): 큰 머리, 과장된 특징 하나(모찌룡 날개+하트 꼬리, 우파 깃털 아가미+웃는 입, 뭉게 구름 털+파란 뿔+별, **고양이는 새로 디자인** — 특징 하나를 정해 과장), 3/4 각도, 절제된 색, 하이라이트 눈, 가슴 앞 앞발. 포즈는 머리 dy(-1/0/+1/+2)와 몸 세로 비율로, 발은 고정. 옷 7종은 펫마다 앵커(머리 위, 눈, 목, 몸통)에 붙인다: 모자류는 머리 위 앵커에 기존 패턴, 선글라스는 눈 앵커, 줄무늬 티는 목 아래 몸통 셀 색 바꾸기, 망토는 몸 뒤에 그리고 목 줄, 목도리는 목 줄 + 꼬리.

- [ ] **Step 1: 실패하는 테스트**

```ts
const NONE = { hat: null, body: null, acc: null };
test("every pet, pose and eye draws inside the grid", () => { for (const p of PETS) for (const pose of ["mid","up","down","squash"] as const) for (const e of ["open","blink","happy"] as const) { const r = petRects(p.id, pose, e, NONE); expect(r.length).toBeGreaterThan(20); for (const [x, y, w, h] of r) { expect(x).toBeGreaterThanOrEqual(0); expect(y).toBeGreaterThanOrEqual(0); expect(x + w).toBeLessThanOrEqual(40); expect(y + h).toBeLessThanOrEqual(40); } } });
test("silhouettes are one colour", () => { for (const p of PETS) expect(new Set(silhouetteRects(p.id).map((r) => r[4]))).toEqual(new Set(["#120a20"])); });
test("every pet wears every item", () => { for (const p of PETS) { expect(petRects(p.id, "mid", "open", { ...NONE, hat: "crown" }).some((r) => r[4] === "#ffd23f")).toBe(true); expect(petRects(p.id, "mid", "open", { ...NONE, body: "tee" }).some((r) => r[4] === "#4cc9f0")).toBe(true); /* cape #d62828, shades #3d3d6b, scarf #2a9d8f, ribbon #ff4d6d, cap #3a86ff 도 같은 식 */ } });
test("cached", () => { expect(petRects("mochi", "up", "open", NONE)).toBe(petRects("mochi", "up", "open", NONE)); });
```

- [ ] **Step 2: 실패 확인** — FAIL
- [ ] **Step 3: 구현.** 앞발·발 테두리는 `line: "under"` (아래쪽 주름만) — 콘셉트 v2에서 고친 방식.
- [ ] **Step 4: 통과 확인** — PASS
- [ ] **Step 5: 눈으로 확인** — `out/pet-sheet.tsx`(4마리 × 포즈 4 × 옷 조합 3, 실루엣 4) 렌더: `$R render out/pet-sheet.tsx -o out/pet-sheet.png --frame 0` 후 PNG를 열어 본다. 옷이 머리·눈·목에 맞는지, 고양이가 다른 셋과 같은 원칙으로 보이는지, 실루엣만으로 넷이 구분되는지.
- [ ] **Step 6: 체크포인트**

### Task 7: 화면 — 글자, 홈(슬롯·삭제·펫 상점·공개 연출), 설정 언어

**Files:**
- Create: `ui/pixels.tsx` (edit.tsx의 `Pixels, PText, Icon, FitIcon, PixelButton, Badge, rect, over` 를 옮기고 `Label` 추가), `ui/home.tsx`, `ui/settings.tsx`
- Modify: `edit.tsx` (옮긴 것 import), 확인용 `out/ui-sheet.tsx`
- Test: 렌더 확인(아래)

**Interfaces:**
- Consumes: `t`, `Key` (Task 2), `petCard`, `slotSummary`, layout Box (Task 4), `petRects`, `silhouetteRects` (Task 6).
- Produces: `Label({ s, px, x, y, color?, align?, opacity? })` — `canDraw(s)` 면 `PText`, 아니면 Apple SD Gothic Neo 800, `fontSize = px * 8`, 그림자 `${px}px ${px}px 0 #2a1b2e`, align은 넓은 상자 + textAlign으로. `Home({ g, frame })`, `Settings({ g })` (자동 저장·효과음·언어 3줄).
- 화면: 슬롯 카드(펫 그림, 이름, 코인, 스타일, 플레이 시간 분) / 빈 칸 "새 게임" / 휴지통 버튼. 삭제 확인 창. 펫 패널(카드 4장: 보유는 그림+이름+능력+"보유", 미보유는 실루엣+"???"+능력+해 아이콘 가격+BUY). 공개 연출 180프레임: 0~60 실루엣이 밝아지며 색으로 채워짐, 60~90 통통 뛰기, 이름 등장, 팡파레. 홈 위 띠에 해 아이콘 + 태양빛 개수.

- [ ] **Step 1: `out/ui-sheet.tsx`** — 만든 `Game` 상태 여러 개(`makeInitial` 뒤 필드를 덮어써서)를 한 장에 축소해 그리는 확인용 컴포지션: 홈(슬롯 2개 참·1개 빈 칸), 삭제 확인, 펫 패널(보유 1 + 실루엣 3, 태양빛 4), 공개 연출 t=+40, 설정. 언어 `ko`/`en` 두 벌, 최악값(코인 1.23M, 이름 가장 긴 것).
- [ ] **Step 2: 렌더 후 눈으로 확인** — `$R render out/ui-sheet.tsx -o out/ui-sheet.png --frame 0`. 넘치거나 겹치는 글자 없음, 실루엣에서 색·이름 안 보임, 한글이 그림자와 함께 읽힘.
- [ ] **Step 3: 실제 흐름 확인** — 스크립트 live 입력(HOME은 스크래치)으로 홈 → 빈 슬롯 → 고양이 선택 → 플레이 → 💾 → 홈, 펫 패널 열기, 삭제 확인 창의 프레임을 `$R render edit.tsx --input <log> --at ...` 로 뽑아 확인.
- [ ] **Step 4: 체크포인트**

### Task 8: 화면 — 플레이(HUD 태양빛, 하늘 주기, 펫 도구·대박 탭, 언어)

**Files:**
- Create: `ui/sky.tsx` (`skyAt(sunFrames: number): { bands: string[]; sun: { x: number; y: number } | null; moon: { x: number; y: number } | null; stars: number }` 순수 함수 + `Sky` 컴포넌트), `ui/play.tsx` (HUD, 위 버튼들, Shop, Closet, Ask, Pops, Saved — edit.tsx에서 옮김)
- Modify: `edit.tsx`
- Test: `tests/sky.test.ts`, `out/ui-sheet.tsx` 에 플레이 상태 추가

**Interfaces:**
- Consumes: `acc.sunFrames`, `sunT` (Task 5), `petOf` 도구 이름·아이콘 (Task 3), `petRects` (Task 6), `Label` (Task 7).
- Produces: HUD 칸 5개(코인, 초당, 탭, 태양빛 개수+다음까지 막대, 스타일). 하늘: 하루(72000프레임) = 아침 0~0.2, 낮 0.2~0.5, 노을 0.5~0.7, 밤 0.7~1.0, 단계마다 6줄 색 + 경계 디더(지금 방식). 해 뜰 때(`frame - sunT < 180`) Arena 배너 "태양빛 +1". 우파 대박 탭은 큰 금색 팝업.

- [ ] **Step 1: 실패하는 테스트**

```ts
test("the day's phases", () => { expect(skyAt(0).sun).not.toBeNull(); expect(skyAt(0.35 * 72000).sun!.y).toBeLessThan(skyAt(0.05 * 72000).sun!.y); expect(skyAt(0.85 * 72000).moon).not.toBeNull(); expect(skyAt(0.85 * 72000).stars).toBeGreaterThan(0); expect(skyAt(0.35 * 72000).stars).toBe(0); });
test("same time, same sky", () => { expect(skyAt(12345)).toEqual(skyAt(12345)); });
```

- [ ] **Step 2: 실패 확인** — FAIL
- [ ] **Step 3: 구현**
- [ ] **Step 4: 통과 확인** — `bun test` 전체 → PASS
- [ ] **Step 5: 눈으로 확인** — `out/ui-sheet.tsx` 에 플레이 화면 4장(하늘 단계별, 펫 4마리, 상점 열림 한국어·영어, 옷장 열림, 해 뜨는 배너) 추가해 렌더. 넘침·겹침 없음.
- [ ] **Step 6: 체크포인트**

### Task 9: 저장 연결, 소리, 데모, 점검, 앱

**Files:**
- Modify: `edit.tsx` (effect: `saveN` → `writeSlot("slot" + (cur+1), p)`; `accN` → `writeSlot("account", acc)`; `setN` → `writeSlot("settings", set)`; `delN` → `deleteSlot("slot" + (delSlot+1))`; `migrated` → 한 번 `writeSlot("slot1", slots[0])`; 모두 live에서만), `sfx.mjs` (+ `sunrise`, `reveal`, `jackpot`, `delete`), `game.ts` (데모·playtest)
- Test: 스크립트 live 렌더(HOME 스크래치), `raea check`, 앱 자체 테스트

**Interfaces:**
- Consumes: 앞 Task 전부.
- 데모(아무도 조작 안 할 때): 빈 슬롯 1 → 고양이 → 탭 → SHOP(고양이 도구) → CLOSET 입어보고 사기 → 💾 → 홈 → PETS 패널(실루엣) → 닫기 → 슬롯 1 이어 하기 → 탭. `playtest.actions` 에 `["1"], ["p"], ["Escape"]` 추가, `observe` 에 `pet, sun`.

- [ ] **Step 1: 저장 왕복** — 스크래치 HOME에서 run 1(새 게임 슬롯 2, 탭, 💾→홈, 설정에서 English) 후 `sqlite3 "<HOME>/Library/Application Support/pixel-pet-save.db" "select slot, data from save"` 에 `slot2`, `account`, `settings{lang:"en"}` 이 있다. run 2 첫 홈 프레임에 슬롯 2 카드가 코인과 함께, 영어로 나온다.
- [ ] **Step 2: 이전 왕복** — 스크래치 DB에 지금 형식의 `main` 행만 넣고 실행 → `slot1` 행이 생기고 `main` 은 남아 있다. 홈 슬롯 1 카드가 그 코인·옷으로 나온다.
- [ ] **Step 3: 삭제 왕복** — 슬롯 2 삭제 후 DB에 `slot2` 행이 없다.
- [ ] **Step 4: 점검** — `bun test` 전체 PASS; `$R check --quick edit.tsx` 0 errors; 데모 렌더 스틸(홈, 고르기, 플레이, 옷장, 펫 패널) 확인.
- [ ] **Step 5: 앱** — `$R export-game edit.tsx -o "out/Pixel Pet.app" --target mac-app --name "Pixel Pet" --icon out/icon.png --player /Users/sarah/Development/dailyco/raea/target/game/raea-game`(기존 .app은 옆으로 옮겨 둠) → 리포트 `"sound": true`; 스크래치 HOME에서 `--selftest 12s --keys "1,Enter, , " --no-pointer` → PASS, DB에 슬롯 행 생김; `ditto -c -k --keepParent` 로 zip.
- [ ] **Step 6: 사용자 창 다시 띄우기** — `$R play edit.tsx --size 1600x900` (백그라운드).
