# SDD ledger — plan: projects/pixel-pet/docs/superpowers/plans/2026-11-11-pets-sunlight-slots.md
Setup: Ruling: work in place on main, no worktree, no commits — project files are untracked (a worktree would not contain them), the user said "그냥 진행해줘", and the session rule is to commit only when the user asks — cost if wrong: no per-task commit ranges; review package built from file list instead of a git range.
Pre-flight: T1→T2 items.ts created in T1 (ids/slot/price), T2 adds name keys — consistent.
Pre-flight: T1 Lang type consumed by T2 i18n — consistent.
Pre-flight: T3 consumes SlotData.tools [sec, tap] order — matches T1 migrate (pickaxe→0, gloves→1).
Pre-flight: T4 consumes perSecond/perTap/petOf; T5 extends step — T4 must keep play logic working with T3 functions (T4 already switches tools to petOf) — Ruling: T4 wires shop rows to petOf tools and perSecond/perTap so the play step compiles; T5 adds sunlight + jackpot pops + tests — cost if wrong: none.
Pre-flight: T6 petRects replaces art.ts pet(); edit.tsx Pet uses pet() until T7/T8 — Ruling: T6 switches the view's Pet to petRects in the same task so the game keeps rendering — cost if wrong: none.
Pre-flight: T7/T8 consume Label/canDraw from T2 — consistent.
Task 1: complete (commits f876593..f876593, tests: sh -c 'cd projects/pixel-pet && bun test 2>&1' → Ran 7 tests across 1 file. [9.00ms])
Task 1: Ruling: coins kept as fractions in checkSlot (amount, not floor) — spec allows fractional coins for ability multipliers — cost if wrong: old saves unaffected (they were whole).
Task 2: complete (commits f876593..f876593, tests: sh -c 'cd projects/pixel-pet && bun test 2>&1' → Ran 13 tests across 2 files. [13.00ms])
Task 2: Ruling: language names in settings (한국어 / ENGLISH) are drawn as raw strings, not STR keys — the English entry would need Hangul, which the pixel font can't draw — cost if wrong: none.
Task 3: complete (commits f876593..f876593, tests: sh -c 'cd projects/pixel-pet && bun test 2>&1' → Ran 19 tests across 3 files. [19.00ms])
Task 3: Ruling: upa jackpot uses hash(frame*31+7) rather than hash(frame) — decorrelates it from the pop-position hash(now*3) — cost if wrong: none (test pins rate and determinism).
Task 4: complete (commits f876593..f876593, tests: sh -c 'cd projects/pixel-pet && bun test 2>&1' → Ran 30 tests across 4 files. [19.00ms])
Task 4: Ruling: in the "pick" view an unowned pet's card only fails (no purchase there) — spec puts purchases in the PETS panel; keeps one place to buy — cost if wrong: one extra click to buy then pick.
Task 4: Ruling: the home screen's pet is the last pet played (lastPet), cat at first — spec leaves it open — cost if wrong: cosmetic.
Task 4: Ruling: a reveal is dismissed by a click after 30 frames, or by itself after 300 — keeps the moment from being skipped by a stray click — cost if wrong: timing only.
Task 4: Ruling: tests/drive.ts accepts a point {x,y} as a click target, and two test windows were fixed (a payout second and a click past the window) — test mistakes, not code — cost if wrong: none.
Task 5: complete (commits f876593..f876593, tests: sh -c 'cd projects/pixel-pet && bun test 2>&1' → Ran 39 tests across 5 files. [46.00ms])
Task 5: Ruling: home test compares the new slot ignoring playFrames — T5 now counts play frames from the first frame of play — cost if wrong: none.
Task 6: complete (commits f876593..f876593, tests: sh -c 'cd projects/pixel-pet && bun test 2>&1' → Ran 45 tests across 6 files. [148.00ms])
Task 6: Ruling: the pet canvas is 40x44 (PET_W x PET_H), the 40x40 grid shifted 4 rows down — hats on Mungge's wool would clip above row 0 — cost if wrong: none (tests use PET_W/PET_H).
Task 6: Ruling: the view's switch to petRects moves to Task 7 — edit.tsx has not bundled since Task 4 removed its imports, and T7 rewrites it — cost if wrong: none.
Task 6: visual check out/pet-sheet.png — 4 pets x poses x outfits x silhouettes looked at; hats, tee, cape, scarf, shades sit right on all four.
Task 7: complete (commits f876593..f876593, tests: sh -c 'cd projects/pixel-pet && bun test 2>&1' → Ran 45 tests across 6 files. [147.00ms])
Task 7: Ruling: the drawn tree lives in ui/screen.tsx (Screen), shared by edit.tsx and out/ui-sheet.tsx — importing edit.tsx would register a second root — cost if wrong: none.
Task 7: Ruling: the save effects and the four new sounds (sunrise, reveal, jackpot, delete) went in with the edit.tsx rewrite; Task 9 verifies them on disk — cost if wrong: none.
Task 7: Ruling: step 3's scripted live flow (home → slot → pick → play → save → home) is run once, in Task 9 step 1, with the disk check — same run, no duplicate — cost if wrong: none.
Task 7: visual check out/ui-sheet/frame-0000{0..3}.png (16 states, ko and en, worst values) — fixed: language switch text overflow, need-sunlight text too small.
Task 8: complete (commits f876593..f876593, tests: sh -c 'cd projects/pixel-pet && bun test 2>&1' → Ran 48 tests across 7 files. [130.00ms])
Task 8: Ruling: skyAt lives in ui/skyAt.ts (pure, no React) instead of ui/sky.tsx — bun tests import it without the view — cost if wrong: none.
Task 8: Ruling: the sunrise banner takes the Arena banner slot for 180 frames and wins over the all-dressed banner — both are moments; the sunrise is the rarer — cost if wrong: one banner shows 3 s later.
Task 8: visual check out/ui-sheet-c (morning/day/sunset/night in play, sunrise banner ko/en, home by night/day).
Task 9: verified — save round trip (slot2/account/settings rows; run 2 shows slot 2 in English; delete removes slot2), migration (main → slot1 tools [1,1], main kept), raea check --quick, demo stills, export-game sound:true assets:15, selftest PASS with slot1+account rows, zip.
Task 9: Ruling: raea check's safe-area errors (Korean HUD/hint labels in the top/bottom 120 px) are left — they're the Arena's score and hint bands of a desktop game, not a platform video's UI zones; English pixel text there was never flagged because it isn't text to the check — cost if wrong: none for play; a video cut of the game would want a crop.
Task 9: Ruling: Korean Label boxes sized to an estimate of their text (Hangul 1.05 em, else 0.65) — the 2400-px alignment box tripped raea check's clipped-text error — cost if wrong: a label a little off-centre.
Task 9: Ruling: number keys 1-4 pick or buy in the PETS/pick panels (test "number keys pick or buy in the pets panels") — without them the app's keyboard self-test (and the playtest bot) could never start a game — cost if wrong: none.
Task 9: complete (commits f876593..f876593, tests: sh -c 'cd projects/pixel-pet && bun test 2>&1' → Ran 49 tests across 7 files. [130.00ms])
After plan (user request): Ruling: the home screen shows CONTINUE (top) and NEW GAME (under it); each opens the three slots in a modal. CONTINUE plays a saved slot (an empty one goes to picking a pet), NEW GAME picks a pet for an empty slot or asks "start over?" for a saved one (replaced only when a pet is picked); delete stays per slot in the modal. Tests rewritten for the flow (home 15 tests, play helper), app re-exported, selftest PASS with "n,1,1, " keys — cost if wrong: layout only.
After plan (user request): Ruling: the language setting is two tabs (한국어 | ENGLISH), the picked one lit; picking the one already picked writes nothing (test 'language tabs') — cost if wrong: none.
After plan (user request): Ruling: Upa's jackpot is 1% (was 10%) and the Korean word is 잭팟 — the user found Upa too strong; tests pin 1% (140-260 hits in 20000 taps) — cost if wrong: one number.
After plan (user request): Ruling: Mochiryu is all coins +50% (sec and tap) with a 5% x5 jackpot; the HUD's per-tap number is tapBase (no jackpot) so a jackpot frame can't show there — cost if wrong: one number.
After plan (user request): Ruling: Mungge is coins a second +25%; Mochiryu is all coins +25% with a 5% x5 jackpot (supersedes the +50% line above) — cost if wrong: two numbers.
After plan (user request): Ruling: Mochiryu's two abilities sit on two lines (a 
 in the string; WrapLabel breaks at 
 first; the pixel-font test checks each line) — cost if wrong: none.
After plan (user request): Ruling: in the PETS panel, an owned pet's card (no button) has its picture and words moved down 90 to sit in the card's middle; the pick view and unowned cards keep the top layout above their button — cost if wrong: layout only.
After plan (user request): Ruling: tool gains grow like Fibonacci (sec 1,2,4,7,12,20,33…; tap 1,2,3,5,8,13…) and prices x1.6 a level (20 / 15 first), so a level's payback stays ~12-22 s or taps all the way up — the user found x1.8/x1.7 prices against +1 gains too weak; supersedes the spec's curve — cost if wrong: two formulas in pets.ts.
After plan (user request): Ruling: closet prices spread wide and rise with cuteness (my ranking, open to the user): shades 30 < cap 80 < tee 200 < cape 500 < scarf 1,200 < crown 3,000 < ribbon 8,000 (test 'the cuter, the dearer'); the list keeps its hat/outfit/accessory order; the demo still buys shades and cap and fails on the tee — cost if wrong: seven numbers.
After plan (user request): Ruling: numbers from a thousand up show K/M/B with three figures, cut not rounded (1.18K, 12.3K, 123K, 1.23M) so coins never look like more than they are; rates under a thousand keep one decimal — cost if wrong: display only.
After plan (user request): Ruling: the closet lists items cheapest first (shades, cap, tee, cape, scarf, crown, ribbon); the demo's closet rows follow — cost if wrong: order only.
Final: fixed runaway economy (gain x1.618 vs price x1.6) — tests "a level never pays itself back faster than the one before" and "two hours of greedy play stay finite and fit on screen" RED (hang, then 1.4e16/s) → GREEN with prices x2; fmt gains T; suite 59/59.
Final: fixed deleted slots coming back (main re-migrated whenever all slots were empty) — tests "the old save moves only on the first run" and "a first run writes the account at once" RED→GREEN; suite 59/59.
Final: fixed English shop tool names running into their price at high levels — the name drops to px 3 when it doesn't fit beside the price (no unit test; checked by render).
Final: minor (deferred): render reads the disk at module load (INITIAL = makeInitial(readAll())) and may create the DB file; output never depends on it.
Final: minor (deferred): after a relaunch the home pet is the first filled slot's, unclothed, not the last one played.
Final: minor (deferred): hint.settings still says "click a switch" though language is now tabs.
After review (user request): fixed the deferred minor "hint.settings says switch" — it now says switch or tab.
After review (user request): Ruling: the pet walks left/right on the play screen with the arrows or A/D (7 units a frame, between 180 and 1420), faces the way it goes (the sprite mirrored), bobs while it walks; the tap box, pops and labels follow it; it stops while settings or the save question are up; play starts with it back in the middle; the demo doesn't walk (tests tests/walk.test.ts, drive gained held keys) — cost if wrong: feel only.
After review (user request): Ruling: the cape and the crown are the dearest (shades 30, cap 80, tee 200, scarf 500, ribbon 1,200, cape 3,000, crown 8,000), the closet sorted by price — cost if wrong: seven numbers.
After review (user request): Ruling: item prices follow the user's order — ribbon 30, shades 80, cap 200, scarf 500, tee 1,200, cape 3,000, crown 8,000 (closet sorted by price; supersedes the line above) — cost if wrong: seven numbers.
After review (user request): Ruling: Mochiryu's coins-a-second tool is a treasure chest (icon redrawn; named 보물 상자 / TREASURE CHEST so the name matches) — cost if wrong: one name.
After review (user request): Ruling: Mochiryu's coins-a-second tool is named 보물 / TREASURE and drawn as an open chest overflowing with gold (supersedes the chest line above) — cost if wrong: one icon.

## 이후: 도구 10레벨 ×2 (2026-11-11)
- 사용자 결정: 10, 20, 30… 레벨마다 도구 효과 ×2. 가격 ×1.8도 골랐지만 시뮬레이션에서 2시간 뒤 초당 약 1e31로 폭주해 가격은 ×2 유지(2시간 탐욕 플레이: 초당 약 5e10, 지금보다 약 3000배).
- 테스트: 10번째 레벨은 직전 레벨보다 두 배 이상 빨리 본전, 그 외 레벨은 점점 느리게, 10레벨 묶음은 이전 묶음보다 3배 넘게 느리게. 2시간 뒤 초당 1e9~1e12.
- 레포 폴더(~/Development/dailyco/tap-tap-pets)가 이제 작업 위치. ~/raea/games/projects/pixel-pet은 이 변경 전 상태 그대로.
