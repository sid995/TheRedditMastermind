/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest";
import { getAllEvents, getEventsForMonth, getEventsForWeek } from "./calendar-events";
import { addToCalendarHistory } from "./calendar-history";
import type { ContentCalendar } from "@/app/types/calendar";

const CALENDAR_STORAGE_KEY = "reddit-mastermind-calendar";

function makeCalendar(weekStart: Date, itemCount = 2): ContentCalendar {
  return {
    weekStart: new Date(weekStart),
    items: Array.from({ length: itemCount }, (_, i) => ({
      id: `item-${weekStart.getTime()}-${i}`,
      dayOfWeek: i % 7,
      subreddit: "r/test",
      query: "q",
      authorPersonId: "p1",
      replyAssignments: [],
    })),
  };
}

describe("calendar-events", () => {
  beforeEach(() => {
    localStorage.removeItem(CALENDAR_STORAGE_KEY);
    localStorage.removeItem("reddit-mastermind-calendar-history");
  });

  describe("getAllEvents", () => {
    it("returns empty when no current calendar and no history", () => {
      expect(getAllEvents()).toEqual([]);
    });

    it("returns events from current calendar when set", () => {
      const cal = makeCalendar(new Date("2025-01-06T00:00:00Z"), 2);
      localStorage.setItem(
        CALENDAR_STORAGE_KEY,
        JSON.stringify({
          weekStart: cal.weekStart.toISOString(),
          items: cal.items,
        })
      );
      const events = getAllEvents();
      expect(events.length).toBe(2);
      expect(events[0].item.id).toBe(cal.items[0].id);
      expect(events[0].weekStart.getTime()).toBe(cal.weekStart.getTime());
    });

    it("returns events from history when no current calendar", () => {
      const cal = makeCalendar(new Date("2025-01-06T00:00:00Z"), 1);
      addToCalendarHistory(cal);
      const events = getAllEvents();
      expect(events.length).toBe(1);
      expect(events[0].item.subreddit).toBe("r/test");
    });

    it("dedupes by weekStart + item.id when same week in current and history", () => {
      const cal = makeCalendar(new Date("2025-01-06T00:00:00Z"), 1);
      localStorage.setItem(
        CALENDAR_STORAGE_KEY,
        JSON.stringify({ weekStart: cal.weekStart.toISOString(), items: cal.items })
      );
      addToCalendarHistory(cal);
      const events = getAllEvents();
      expect(events.length).toBe(1);
    });
  });

  describe("getEventsForMonth", () => {
    it("filters events to given year and month", () => {
      const cal = makeCalendar(new Date("2025-01-06T00:00:00Z"), 3);
      cal.items[0].dayOfWeek = 1;
      cal.items[1].dayOfWeek = 2;
      cal.items[2].dayOfWeek = 3;
      addToCalendarHistory(cal);
      const events = getEventsForMonth(2025, 0);
      expect(events.length).toBe(3);
      events.forEach((e) => {
        expect(e.date.getFullYear()).toBe(2025);
        expect(e.date.getMonth()).toBe(0);
      });
    });

    it("returns empty for month with no events", () => {
      const cal = makeCalendar(new Date("2025-01-06T00:00:00Z"), 1);
      addToCalendarHistory(cal);
      expect(getEventsForMonth(2024, 0)).toEqual([]);
    });
  });

  describe("getEventsForWeek", () => {
    it("returns events in the 7-day window from weekStart", () => {
      const monday = new Date("2025-01-06T00:00:00Z");
      const cal = makeCalendar(monday, 2);
      cal.items[0].dayOfWeek = 1;
      cal.items[1].dayOfWeek = 2;
      addToCalendarHistory(cal);
      const events = getEventsForWeek(monday);
      expect(events.length).toBe(2);
    });

    it("returns empty for week with no events", () => {
      const monday = new Date("2026-06-01T00:00:00Z");
      expect(getEventsForWeek(monday)).toEqual([]);
    });
  });
});
