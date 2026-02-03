/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadCalendarHistory,
  addToCalendarHistory,
  removeFromCalendarHistory,
  type CalendarHistoryEntry,
} from "./calendar-history";
import type { ContentCalendar } from "@/app/types/calendar";

function makeCalendar(weekStart: string, itemCount = 2): ContentCalendar {
  const start = new Date(weekStart);
  return {
    weekStart: start,
    items: Array.from({ length: itemCount }, (_, i) => ({
      id: `item-${i}`,
      dayOfWeek: i % 7,
      subreddit: "r/test",
      query: "query",
      authorPersonId: "p1",
      replyAssignments: [{ personId: "p2", order: 1 }],
    })),
  };
}

describe("calendar-history", () => {
  const STORAGE_KEY = "reddit-mastermind-calendar-history";

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  describe("loadCalendarHistory", () => {
    it("returns empty array when no history", () => {
      expect(loadCalendarHistory()).toEqual([]);
    });

    it("returns empty array when storage is invalid JSON", () => {
      localStorage.setItem(STORAGE_KEY, "not json");
      expect(loadCalendarHistory()).toEqual([]);
    });

    it("returns empty array when storage is not an array", () => {
      localStorage.setItem(STORAGE_KEY, "{}");
      expect(loadCalendarHistory()).toEqual([]);
    });
  });

  describe("addToCalendarHistory", () => {
    it("adds entry and load returns it with revived weekStart", () => {
      const cal = makeCalendar("2025-01-06");
      addToCalendarHistory(cal);
      const list = loadCalendarHistory();
      expect(list).toHaveLength(1);
      expect(list[0].weekStart).toBe(cal.weekStart.toISOString());
      expect(list[0].calendar.weekStart).toBeInstanceOf(Date);
      expect(list[0].calendar.weekStart.getTime()).toBe(cal.weekStart.getTime());
      expect(list[0].calendar.items).toHaveLength(2);
    });

    it("replaces existing entry for same weekStart", () => {
      addToCalendarHistory(makeCalendar("2025-01-06", 1));
      addToCalendarHistory(makeCalendar("2025-01-06", 3));
      const list = loadCalendarHistory();
      expect(list).toHaveLength(1);
      expect(list[0].calendar.items).toHaveLength(3);
    });

    it("prepends new entry so newest is first", () => {
      addToCalendarHistory(makeCalendar("2025-01-06"));
      addToCalendarHistory(makeCalendar("2025-01-13"));
      const list = loadCalendarHistory();
      expect(list).toHaveLength(2);
      expect(list[0].weekStart).toBe("2025-01-13T00:00:00.000Z");
      expect(list[1].weekStart).toBe("2025-01-06T00:00:00.000Z");
    });
  });

  describe("removeFromCalendarHistory", () => {
    it("removes entry by id", () => {
      addToCalendarHistory(makeCalendar("2025-01-06"));
      const listBefore = loadCalendarHistory();
      expect(listBefore).toHaveLength(1);
      removeFromCalendarHistory(listBefore[0].id);
      expect(loadCalendarHistory()).toHaveLength(0);
    });

    it("leaves other entries when removing one", () => {
      vi.useFakeTimers();
      addToCalendarHistory(makeCalendar("2025-01-06"));
      vi.advanceTimersByTime(1);
      addToCalendarHistory(makeCalendar("2025-01-13"));
      vi.useRealTimers();
      const list = loadCalendarHistory();
      const toRemove = list[0].id;
      removeFromCalendarHistory(toRemove);
      const after = loadCalendarHistory();
      expect(after).toHaveLength(1);
      expect(after[0].id).not.toBe(toRemove);
    });
  });
});
