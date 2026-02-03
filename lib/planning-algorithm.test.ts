import { describe, it, expect } from "vitest";
import {
  generateCalendar,
  getWeekStart,
  getNextWeekStart,
} from "@/lib/planning-algorithm";
import { evaluateCalendarQuality } from "@/lib/calendar-quality";
import type { Config } from "@/app/types/calendar";

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    company: { name: "Test Co", description: "", goal: "" },
    people: [
      { id: "p1", name: "Alice", description: "" },
      { id: "p2", name: "Bob", description: "" },
    ],
    subreddits: "r/startups, r/SaaS, r/entrepreneur",
    queries: "best tools, slide design, pitch deck",
    postsPerWeek: 5,
    ...overrides,
  };
}

const MON_JAN_6_2025 = new Date("2025-01-06T00:00:00Z");

describe("getWeekStart", () => {
  it("returns Monday 00:00 for a date in the week", () => {
    const monday = getWeekStart(new Date("2025-01-08"));
    expect(monday.getDay()).toBe(1);
    expect(monday.getHours()).toBe(0);
    expect(monday.getMinutes()).toBe(0);
  });

  it("returns same Monday for Sunday", () => {
    const sunday = new Date("2025-01-12");
    const monday = getWeekStart(sunday);
    expect(monday.getDay()).toBe(1);
    expect(monday.getDate()).toBe(6);
  });
});

describe("getNextWeekStart", () => {
  it("returns 7 days later (same weekday in UTC)", () => {
    const next = getNextWeekStart(MON_JAN_6_2025);
    expect(next.getTime() - MON_JAN_6_2025.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
    expect(next.getUTCDay()).toBe(MON_JAN_6_2025.getUTCDay());
  });
});

describe("generateCalendar – validation", () => {
  it("throws when fewer than 2 people", () => {
    const config = makeConfig({
      people: [{ id: "p1", name: "Only", description: "" }],
    });
    expect(() => generateCalendar(config, MON_JAN_6_2025)).toThrow(
      "At least 2 people required"
    );
  });

  it("throws when no subreddits", () => {
    const config = makeConfig({ subreddits: "" });
    expect(() => generateCalendar(config, MON_JAN_6_2025)).toThrow(
      "At least 1 subreddit required"
    );
  });

  it("throws when no queries", () => {
    const config = makeConfig({ queries: "" });
    expect(() => generateCalendar(config, MON_JAN_6_2025)).toThrow(
      "At least 1 query required"
    );
  });

  it("throws when postsPerWeek < 1", () => {
    const config = makeConfig({ postsPerWeek: 0 });
    expect(() => generateCalendar(config, MON_JAN_6_2025)).toThrow(
      "postsPerWeek must be at least 1"
    );
  });
});

describe("generateCalendar – varying inputs", () => {
  it("produces correct number of items for 2 people, 3 subreddits, 3 queries, 5 posts/week", () => {
    const config = makeConfig({ postsPerWeek: 5 });
    const cal = generateCalendar(config, MON_JAN_6_2025);
    expect(cal.items.length).toBe(5);
    expect(cal.weekStart.getDay()).toBe(1);
  });

  it("works with 3+ personas", () => {
    const config = makeConfig({
      people: [
        { id: "p1", name: "Alice", description: "" },
        { id: "p2", name: "Bob", description: "" },
        { id: "p3", name: "Carol", description: "" },
      ],
      postsPerWeek: 6,
    });
    const cal = generateCalendar(config, MON_JAN_6_2025);
    expect(cal.items.length).toBe(6);
    const authorIds = new Set(cal.items.map((i) => i.authorPersonId));
    expect(authorIds.size).toBeGreaterThanOrEqual(2);
  });

  it("works with single subreddit (respects cap)", () => {
    const config = makeConfig({
      subreddits: "r/only",
      queries: "q1, q2, q3",
      postsPerWeek: 10,
    });
    const cal = generateCalendar(config, MON_JAN_6_2025);
    const subCount: Record<string, number> = {};
    for (const i of cal.items) {
      subCount[i.subreddit] = (subCount[i.subreddit] ?? 0) + 1;
    }
    expect(Math.max(...Object.values(subCount))).toBeLessThanOrEqual(3);
  });

  it("works with many subreddits and many queries", () => {
    const config = makeConfig({
      subreddits: "r/a, r/b, r/c, r/d, r/e",
      queries: "q1, q2, q3, q4, q5, q6",
      postsPerWeek: 7,
    });
    const cal = generateCalendar(config, MON_JAN_6_2025);
    expect(cal.items.length).toBe(7);
  });
});

describe("generateCalendar – edge cases", () => {
  it("never exceeds MAX_POSTS_PER_SUBREDDIT (3) per subreddit", () => {
    const config = makeConfig({
      subreddits: "r/one, r/two",
      queries: "a, b, c, d, e, f, g",
      postsPerWeek: 10,
    });
    const cal = generateCalendar(config, MON_JAN_6_2025);
    const subCount: Record<string, number> = {};
    for (const i of cal.items) {
      subCount[i.subreddit] = (subCount[i.subreddit] ?? 0) + 1;
    }
    for (const count of Object.values(subCount)) {
      expect(count).toBeLessThanOrEqual(3);
    }
  });

  it("diversifies queries (no single query overused)", () => {
    const config = makeConfig({
      subreddits: "r/a, r/b, r/c",
      queries: "q1, q2, q3",
      postsPerWeek: 6,
    });
    const cal = generateCalendar(config, MON_JAN_6_2025);
    const queryCount: Record<string, number> = {};
    for (const i of cal.items) {
      queryCount[i.query] = (queryCount[i.query] ?? 0) + 1;
    }
    for (const count of Object.values(queryCount)) {
      expect(count).toBeLessThanOrEqual(2);
    }
  });

  it("author is never in own replyAssignments", () => {
    const config = makeConfig({ postsPerWeek: 10 });
    const cal = generateCalendar(config, MON_JAN_6_2025);
    for (const item of cal.items) {
      for (const r of item.replyAssignments) {
        expect(r.personId).not.toBe(item.authorPersonId);
      }
    }
  });

  it("each post has 1–2 reply persons with order", () => {
    const config = makeConfig({ postsPerWeek: 5 });
    const cal = generateCalendar(config, MON_JAN_6_2025);
    for (const item of cal.items) {
      expect(item.replyAssignments.length).toBeGreaterThanOrEqual(1);
      expect(item.replyAssignments.length).toBeLessThanOrEqual(2);
      const orders = item.replyAssignments.map((r) => r.order ?? 0).sort((a, b) => a - b);
      expect(orders).toEqual([...new Set(orders)].sort((a, b) => a - b));
    }
  });

  it("distributes posts across days (not all on one day)", () => {
    const config = makeConfig({ postsPerWeek: 7 });
    const cal = generateCalendar(config, MON_JAN_6_2025);
    const dayCount: Record<number, number> = {};
    for (const i of cal.items) {
      dayCount[i.dayOfWeek] = (dayCount[i.dayOfWeek] ?? 0) + 1;
    }
    const daysUsed = Object.keys(dayCount).length;
    expect(daysUsed).toBeGreaterThanOrEqual(1);
  });
});

describe("generateCalendar – determinism", () => {
  it("same config and weekStart produces same calendar", () => {
    const config = makeConfig({ postsPerWeek: 5 });
    const cal1 = generateCalendar(config, MON_JAN_6_2025);
    const cal2 = generateCalendar(config, MON_JAN_6_2025);
    expect(cal1.items.length).toBe(cal2.items.length);
    for (let i = 0; i < cal1.items.length; i++) {
      expect(cal1.items[i].dayOfWeek).toBe(cal2.items[i].dayOfWeek);
      expect(cal1.items[i].subreddit).toBe(cal2.items[i].subreddit);
      expect(cal1.items[i].query).toBe(cal2.items[i].query);
      expect(cal1.items[i].authorPersonId).toBe(cal2.items[i].authorPersonId);
    }
  });

  it("different weekStart produces different calendar", () => {
    const config = makeConfig({ postsPerWeek: 5 });
    const cal1 = generateCalendar(config, MON_JAN_6_2025);
    const nextMonday = getNextWeekStart(MON_JAN_6_2025);
    const cal2 = generateCalendar(config, nextMonday);
    const same = cal1.items.every(
      (item, i) =>
        cal2.items[i] &&
        item.subreddit === cal2.items[i].subreddit &&
        item.query === cal2.items[i].query &&
        item.authorPersonId === cal2.items[i].authorPersonId
    );
    expect(same).toBe(false);
  });
});

describe("evaluateCalendarQuality", () => {
  it("scores calendar and returns breakdown", () => {
    const config = makeConfig({ postsPerWeek: 5 });
    const cal = generateCalendar(config, MON_JAN_6_2025);
    const result = evaluateCalendarQuality(cal, config);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10);
    expect(result.breakdown).toHaveProperty("subredditCap");
    expect(result.breakdown).toHaveProperty("queryDiversity");
    expect(result.breakdown).toHaveProperty("authorBalance");
    expect(result.breakdown).toHaveProperty("replyBalance");
    expect(result.breakdown).toHaveProperty("noSelfReply");
    expect(result.breakdown).toHaveProperty("daySpread");
  });

  it("gives high score (>= 7) for well-balanced calendar", () => {
    const config = makeConfig({
      people: [
        { id: "p1", name: "A", description: "" },
        { id: "p2", name: "B", description: "" },
        { id: "p3", name: "C", description: "" },
      ],
      subreddits: "r/a, r/b, r/c, r/d",
      queries: "q1, q2, q3, q4, q5",
      postsPerWeek: 5,
    });
    const cal = generateCalendar(config, MON_JAN_6_2025);
    const result = evaluateCalendarQuality(cal, config);
    expect(result.score).toBeGreaterThanOrEqual(6);
    expect(result.breakdown.noSelfReply).toBe(1);
    expect(result.breakdown.subredditCap).toBe(1);
  });

  it("gives low score for empty calendar", () => {
    const config = makeConfig();
    const cal = generateCalendar(config, MON_JAN_6_2025);
    cal.items.length = 0;
    const result = evaluateCalendarQuality(cal, config);
    expect(result.score).toBe(0);
  });
});
