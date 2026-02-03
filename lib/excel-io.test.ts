import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import {
  exportCalendarExcel,
  exportCalendarCsv,
  exportCalendarJson,
} from "./excel-io";
import type { Config, ContentCalendar } from "@/app/types/calendar";

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    company: { name: "Test Co", website: "https://example.com", description: "", goal: "" },
    people: [
      { id: "p1", name: "Alice", description: "" },
      { id: "p2", name: "Bob", description: "" },
    ],
    subreddits: "r/startups\nr/SaaS",
    queries: "best tools, slide design",
    postsPerWeek: 5,
    ...overrides,
  };
}

function makeCalendar(weekStart: string): ContentCalendar {
  return {
    weekStart: new Date(weekStart),
    items: [
      {
        id: "item-1",
        dayOfWeek: 1,
        subreddit: "r/startups",
        query: "best tools",
        authorPersonId: "p1",
        replyAssignments: [{ personId: "p2", order: 1 }],
      },
      {
        id: "item-2",
        dayOfWeek: 3,
        subreddit: "r/SaaS",
        query: "slide design",
        authorPersonId: "p2",
        replyAssignments: [{ personId: "p1", order: 1 }],
      },
    ],
  };
}

describe("excel-io", () => {
  describe("exportCalendarExcel", () => {
    it("returns ArrayBuffer", () => {
      const buf = exportCalendarExcel(makeConfig(), makeCalendar("2025-01-06"));
      expect(buf).toBeInstanceOf(ArrayBuffer);
      expect(buf.byteLength).toBeGreaterThan(0);
    });

    it("produces workbook with config and posts", () => {
      const config = makeConfig();
      const calendar = makeCalendar("2025-01-06");
      const buf = exportCalendarExcel(config, calendar);
      const wb = XLSX.read(buf, { type: "array" });
      expect(wb.SheetNames).toContain("Content Calendar");
      const ws = wb.Sheets["Content Calendar"];
      const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
      expect(rows.length).toBeGreaterThan(5);
      expect(rows[0]).toEqual(["Name", config.company.name]);
      expect(rows[1][0]).toBe("Website");
      const postHeaderRow = rows.find(
        (r: unknown) => Array.isArray(r) && (r as string[])[0] === "post_id"
      ) as string[] | undefined;
      expect(postHeaderRow).toBeDefined();
      const dataRows = rows.filter(
        (r: unknown) =>
          Array.isArray(r) &&
          (r as string[]).length >= 2 &&
          /^P\d+$/.test(String((r as string[])[0]))
      );
      expect(dataRows.length).toBe(calendar.items.length);
    });
  });

  describe("exportCalendarCsv", () => {
    it("returns string with headers Day, Subreddit, Query, Author, Replies", () => {
      const csv = exportCalendarCsv(makeConfig(), makeCalendar("2025-01-06"));
      expect(csv).toContain("Day,Subreddit,Query,Author,Replies");
    });

    it("includes one row per calendar item with author names", () => {
      const config = makeConfig();
      const calendar = makeCalendar("2025-01-06");
      const csv = exportCalendarCsv(config, calendar);
      const lines = csv.split("\n");
      expect(lines.length).toBe(calendar.items.length + 1);
      expect(csv).toContain("Alice");
      expect(csv).toContain("Bob");
      expect(csv).toContain("r/startups");
      expect(csv).toContain("best tools");
    });

    it("escapes fields containing commas or quotes", () => {
      const config = makeConfig();
      const cal = makeCalendar("2025-01-06");
      cal.items[0].query = 'Say "hello", world';
      const csv = exportCalendarCsv(config, cal);
      expect(csv).toContain('"Say ""hello"", world"');
    });
  });

  describe("exportCalendarJson", () => {
    it("returns valid JSON with config and calendar", () => {
      const config = makeConfig();
      const calendar = makeCalendar("2025-01-06");
      const json = exportCalendarJson(config, calendar);
      const parsed = JSON.parse(json);
      expect(parsed.config).toBeDefined();
      expect(parsed.config.company.name).toBe(config.company.name);
      expect(parsed.calendar).toBeDefined();
      expect(parsed.calendar.weekStart).toBe(calendar.weekStart.toISOString());
      expect(Array.isArray(parsed.calendar.items)).toBe(true);
      expect(parsed.calendar.items.length).toBe(calendar.items.length);
    });
  });
});
