import { expect, test } from "bun:test";
import { fmt, fmtRate } from "../art";
import { PETS, hash, paysPerSecond, perPayout, perSecond, perTap, petOf, tapBase } from "../pets";
import { freshSlot } from "../state";

test("catalog: ids, order and sunlight prices", () => {
  expect(PETS.map((p) => p.id)).toEqual(["cat", "upa", "mungge", "mochi"]);
  expect(PETS.map((p) => p.price)).toEqual([0, 3, 5, 8]);
});

test("abilities on coins a second", () => {
  expect(perSecond(freshSlot("cat"))).toBe(1);
  expect(perSecond(freshSlot("upa"))).toBe(1);
  expect(perSecond(freshSlot("mungge"))).toBe(1.25);
  expect(perSecond(freshSlot("mochi"))).toBe(1.25);
  expect(perSecond({ ...freshSlot("mungge"), tools: [2, 0] })).toBe(5);
});

test("abilities on coins a tap", () => {
  expect(perTap(freshSlot("cat"), 0).coins).toBe(3);
  expect(perTap(freshSlot("mungge"), 0).coins).toBe(2);
  expect(tapBase(freshSlot("mochi"))).toBe(2.5);
  expect(tapBase(freshSlot("upa"))).toBe(2);
  expect(perTap({ ...freshSlot("cat"), tools: [0, 3] }, 0).coins).toBe(21);
});

test("a tap upgrade costs half an auto one at every level", () => {
  for (const id of ["cat", "upa", "mungge", "mochi"] as const) {
    const [sec, tap] = petOf(id).tools;
    for (let l = 0; l < 40; l++) expect(tap.cost(l) * 2).toBe(sec.cost(l));
  }
});

test("a tap pays twice a second's coins at the same level, and each level adds twice as much", () => {
  for (const id of ["cat", "upa", "mungge", "mochi"] as const) {
    const [sec, tap] = petOf(id).tools;
    for (let l = 0; l < 40; l++) {
      expect(tap.value(l)).toBe(2 * sec.value(l));
      expect(tap.value(l + 1) - tap.value(l)).toBe(2 * (sec.value(l + 1) - sec.value(l)));
    }
  }
});

test("upa jackpot is about 1 in 100, x5, and the same every time", () => {
  let hits = 0;
  for (let f = 0; f < 20_000; f++) {
    const r = perTap(freshSlot("upa"), f);
    if (r.jackpot) { hits++; expect(r.coins).toBe(10); } else expect(r.coins).toBe(2);
  }
  expect(hits).toBeGreaterThan(140);
  expect(hits).toBeLessThan(260);
  expect(perTap(freshSlot("upa"), 4242)).toEqual(perTap(freshSlot("upa"), 4242));
  expect(perTap(freshSlot("cat"), 4242).jackpot).toBe(false);
  expect(hash(7)).toBe(hash(7));
});

test("mochi: all coins +25% and a 5% x5 jackpot", () => {
  let hits = 0;
  for (let f = 0; f < 20_000; f++) {
    const r = perTap(freshSlot("mochi"), f);
    if (r.jackpot) { hits++; expect(r.coins).toBe(12.5); } else expect(r.coins).toBe(2.5);
  }
  expect(hits).toBeGreaterThan(850);
  expect(hits).toBeLessThan(1150);
  expect(PETS.map((p) => p.jackpot)).toEqual([0, 0.01, 0, 0.05]);
});

test("tools: each level's gain grows (about x1.6), doubles at every tenth level, and its price grows x2", () => {
  const [sec, tap] = petOf("cat").tools;
  const lv = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  expect(lv.map(sec.value)).toEqual([1, 2, 4, 7, 12, 20, 33, 54, 88, 143, 464, 752]);
  expect(lv.map(tap.value)).toEqual([2, 4, 8, 14, 24, 40, 66, 108, 176, 286, 928, 1504]);
  expect(lv.slice(0, 7).map(sec.cost)).toEqual([40, 80, 160, 320, 640, 1280, 2560]);
  expect(lv.slice(0, 7).map(tap.cost)).toEqual([20, 40, 80, 160, 320, 640, 1280]);
  expect([sec.value(20), tap.value(20), tap.value(30)]).toEqual([(28657 - 1) * 4, 2 * (28657 - 1) * 4, 2 * (3524578 - 1) * 8]);
});

test("a level pays back slower than the one before, but a tenth level pays back faster (and ten levels slower)", () => {
  for (const t of petOf("cat").tools.slice(0, 2)) {
    const payback = (l: number) => t.cost(l) / (t.value(l + 1) - t.value(l));
    for (let l = 3; l < 60; l++) {
      if (l % 10 === 9) expect(payback(l), `level ${l + 1}`).toBeLessThan(payback(l - 1) / 2);
      else expect(payback(l), `level ${l + 1}`).toBeGreaterThan(payback(l - 1));
      expect(payback(l + 10), `level ${l + 11}`).toBeGreaterThan(payback(l) * 3);
    }
  }
});

test("two hours of greedy play stay finite and fit on screen", () => {
  // every second: a second's coins and ten taps, then buy the cheapest tool while there's enough
  for (const id of ["cat", "mochi"] as const) {
    let s = freshSlot(id);
    for (let sec = 0; sec < 2 * 3600; sec++) {
      const gain = perSecond(s) + 10 * perTap(s, sec).coins;
      s = { ...s, coins: s.coins + gain };
      for (let buys = 0; buys < 50; buys++) {
        const tools = petOf(id).tools;
        let i = 0;
        for (const j of [1, 2]) if (tools[j].cost(s.tools[j]) < tools[i].cost(s.tools[i])) i = j;
        const cost = tools[i].cost(s.tools[i]);
        if (s.coins < cost) break;
        const next = [...s.tools] as [number, number, number];
        next[i] += 1;
        s = { ...s, coins: s.coins - cost, tools: next };
      }
    }
    expect(Number.isFinite(s.coins)).toBe(true);
    expect(paysPerSecond(s)).toBe(10);
    expect(perSecond(s)).toBeLessThan(1e14);
    expect(perSecond(s), "the tenth levels make it grow").toBeGreaterThan(1e9);
    expect(fmt(s.coins).length).toBeLessThanOrEqual(6);
    expect(fmt(s.coins, 4).length).toBeLessThanOrEqual(6);
    expect(fmtRate(perSecond(s)).length).toBeLessThanOrEqual(6);
  }
});

test("tool costs and names", () => {
  const t = petOf("cat").tools;
  expect([t[0].cost(0), t[0].cost(1), t[1].cost(0), t[1].cost(1)]).toEqual([40, 80, 20, 40]);
  expect(t.map((x) => [x.kind, x.name])).toEqual([["sec", "tool.cat.sec"], ["tap", "tool.cat.tap"], ["speed", "tool.cat.speed"]]);
  expect(petOf("mochi").tools[1].name).toBe("tool.mochi.tap");
});

test("the coins on the HUD in four figures, so a payout shows on a big pile", () => {
  expect(fmt(1_374_000_000_000, 4)).toBe("1.374T");
  expect(fmt(245_319_000_000, 4)).toBe("245.3B");
  expect(fmt(12_345.6, 4)).toBe("12.34K");
  expect(fmt(123_456, 4)).toBe("123.4K");
  expect(fmt(1200, 4)).toBe("1.2K");
  expect(fmt(999.9, 4)).toBe("999");
  expect(fmt(999_912_345_678_901, 4)).toBe("999.9T");
  // a coin short of the next unit is still under it: never shown as more than it is
  expect(fmt(999_999_999_999_999, 4)).toBe("999.9T");
  expect(fmt(999_999_999_999_999)).toBe("999T");
  expect(fmt(999_999)).toBe("999K");
  expect(fmt(1e15)).toBe("1Q");
  expect(fmt(15_757_600_000_000_000, 4)).toBe("15.75Q");
});

test("numbers on screen: K, M, B from a thousand up, three figures, never rounded up", () => {
  expect(fmtRate(1.5)).toBe("1.5");
  expect(fmtRate(2)).toBe("2");
  expect(fmtRate(1.25)).toBe("1.3");
  expect(fmt(84.9)).toBe("84");
  expect(fmt(999.9)).toBe("999");
  expect(fmt(1000)).toBe("1K");
  expect(fmt(1180)).toBe("1.18K");
  expect(fmt(1200)).toBe("1.2K");
  expect(fmt(1199)).toBe("1.19K");
  expect(fmt(3000)).toBe("3K");
  expect(fmt(12_345.6)).toBe("12.3K");
  expect(fmt(123_456)).toBe("123K");
  expect(fmt(1_234_567)).toBe("1.23M");
  expect(fmt(45_600_000)).toBe("45.6M");
  expect(fmt(1_234_567_890)).toBe("1.23B");
  expect(fmt(4_560_000_000_000)).toBe("4.56T");
  expect(fmt(15_757_600_000_000_000)).toBe("15.7Q");
  expect(fmtRate(1597)).toBe("1.59K");
  expect(fmtRate(2584 * 1.5)).toBe("3.87K");
});

test("the speed tool: one more payout of the second's coins each level, up to ten a second", () => {
  for (const p of PETS) {
    const speed = petOf(p.id).tools[2];
    expect(speed.kind).toBe("speed");
    expect(speed.name).toBe(`tool.${p.id}.speed`);
    expect([0, 1, 2, 8, 9, 12].map(speed.value)).toEqual([1, 2, 3, 9, 10, 10]);
    expect([0, 1, 2, 3].map(speed.cost)).toEqual([10_000, 100_000, 1_000_000, 10_000_000]);
    // the last one, x9 to x10, a trillion
    expect(speed.cost(8)).toBe(1e12);
    expect(speed.cost(9)).toBe(Infinity);
  }
});

test("coins a second: a payout's coins times the payouts a second", () => {
  const s = { ...freshSlot("mungge"), tools: [2, 0, 3] as [number, number, number] };
  expect(perPayout(s)).toBe(5);
  expect(paysPerSecond(s)).toBe(4);
  expect(perSecond(s)).toBe(20);
  expect(paysPerSecond(freshSlot("cat"))).toBe(1);
});
