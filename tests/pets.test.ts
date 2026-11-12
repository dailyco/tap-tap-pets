import { expect, test } from "bun:test";
import { fmt, fmtRate } from "../art";
import { PETS, hash, perSecond, perTap, petOf, tapBase } from "../pets";
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
  expect(perTap(freshSlot("cat"), 0).coins).toBe(1.5);
  expect(perTap(freshSlot("mungge"), 0).coins).toBe(1);
  expect(tapBase(freshSlot("mochi"))).toBe(1.25);
  expect(tapBase(freshSlot("upa"))).toBe(1);
  expect(perTap({ ...freshSlot("cat"), tools: [0, 3] }, 0).coins).toBe(7.5);
});

test("upa jackpot is about 1 in 100, x5, and the same every time", () => {
  let hits = 0;
  for (let f = 0; f < 20_000; f++) {
    const r = perTap(freshSlot("upa"), f);
    if (r.jackpot) { hits++; expect(r.coins).toBe(5); } else expect(r.coins).toBe(1);
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
    if (r.jackpot) { hits++; expect(r.coins).toBe(6.25); } else expect(r.coins).toBe(1.25);
  }
  expect(hits).toBeGreaterThan(850);
  expect(hits).toBeLessThan(1150);
  expect(PETS.map((p) => p.jackpot)).toEqual([0, 0.01, 0, 0.05]);
});

test("tools: each level's gain grows (about x1.6), and its price faster (x2)", () => {
  const [sec, tap] = petOf("cat").tools;
  const lv = [0, 1, 2, 3, 4, 5, 6];
  expect(lv.map(sec.value)).toEqual([1, 2, 4, 7, 12, 20, 33]);
  expect(lv.map(sec.cost)).toEqual([20, 40, 80, 160, 320, 640, 1280]);
  expect(lv.map(tap.value)).toEqual([1, 2, 3, 5, 8, 13, 21]);
  expect(lv.map(tap.cost)).toEqual([15, 30, 60, 120, 240, 480, 960]);
});

test("a level never pays itself back faster than the one before (no runaway)", () => {
  for (const t of petOf("cat").tools) {
    const payback = (l: number) => t.cost(l) / (t.value(l + 1) - t.value(l));
    for (let l = 3; l < 60; l++) expect(payback(l)).toBeGreaterThan(payback(l - 1));
  }
});

test("two hours of greedy play stay finite and fit on screen", () => {
  // every second: a second's coins and ten taps, then buy the cheapest tool while there are coins for it
  for (const id of ["cat", "mochi"] as const) {
    let s = freshSlot(id);
    for (let sec = 0; sec < 2 * 3600; sec++) {
      const gain = perSecond(s) + 10 * perTap(s, sec).coins;
      s = { ...s, coins: s.coins + gain };
      for (let buys = 0; buys < 50; buys++) {
        const tools = petOf(id).tools;
        const i = tools[0].cost(s.tools[0]) <= tools[1].cost(s.tools[1]) ? 0 : 1;
        const cost = tools[i].cost(s.tools[i]);
        if (s.coins < cost) break;
        s = { ...s, coins: s.coins - cost, tools: i === 0 ? [s.tools[0] + 1, s.tools[1]] : [s.tools[0], s.tools[1] + 1] };
      }
    }
    expect(Number.isFinite(s.coins)).toBe(true);
    expect(perSecond(s)).toBeLessThan(1e12);
    expect(fmt(s.coins).length).toBeLessThanOrEqual(6);
    expect(fmtRate(perSecond(s)).length).toBeLessThanOrEqual(6);
  }
});

test("tool costs and names", () => {
  const t = petOf("cat").tools;
  expect([t[0].cost(0), t[0].cost(1), t[1].cost(0), t[1].cost(1)]).toEqual([20, 40, 15, 30]);
  expect(t.map((x) => [x.kind, x.name])).toEqual([["sec", "tool.cat.sec"], ["tap", "tool.cat.tap"]]);
  expect(petOf("mochi").tools[1].name).toBe("tool.mochi.tap");
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
  expect(fmtRate(1597)).toBe("1.59K");
  expect(fmtRate(2584 * 1.5)).toBe("3.87K");
});
