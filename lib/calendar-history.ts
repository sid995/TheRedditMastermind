import type { ContentCalendar } from "@/app/types/calendar";

const STORAGE_KEY = "reddit-mastermind-calendar-history";
const MAX_ENTRIES = 30;

function serializeCalendar(cal: ContentCalendar): string {
  return JSON.stringify({
    ...cal,
    weekStart: cal.weekStart.toISOString(),
  });
}

function deserializeCalendar(raw: string): ContentCalendar {
  const data = JSON.parse(raw) as ContentCalendar & { weekStart: string };
  return {
    weekStart: new Date(data.weekStart),
    items: data.items,
  };
}

export interface CalendarHistoryEntry {
  id: string;
  weekStart: string; // ISO, for display and key
  calendar: ContentCalendar;
  createdAt: string; // ISO
}

export function loadCalendarHistory(): CalendarHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { id: string; weekStart: string; calendarJson: string; createdAt: string }[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((e) => ({
      id: e.id,
      weekStart: e.weekStart,
      calendar: deserializeCalendar(e.calendarJson),
      createdAt: e.createdAt,
    }));
  } catch {
    return [];
  }
}

export function addToCalendarHistory(calendar: ContentCalendar): void {
  const list = loadCalendarHistory();
  const weekStart = new Date(calendar.weekStart).toISOString();
  const existing = list.find((e) => e.weekStart === weekStart);
  const newEntry: CalendarHistoryEntry = {
    id: `hist-${Date.now()}`,
    weekStart,
    calendar: JSON.parse(JSON.stringify(calendar)),
    createdAt: new Date().toISOString(),
  };
  newEntry.calendar.weekStart = new Date(newEntry.calendar.weekStart);
  const filtered = existing ? list.filter((e) => e.weekStart !== weekStart) : list;
  const next = [newEntry, ...filtered].slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        next.map((e) => ({
          id: e.id,
          weekStart: e.weekStart,
          calendarJson: serializeCalendar(e.calendar),
          createdAt: e.createdAt,
        }))
      )
    );
  } catch {
    // ignore
  }
}

export function removeFromCalendarHistory(id: string): void {
  const list = loadCalendarHistory().filter((e) => e.id !== id);
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        list.map((e) => ({
          id: e.id,
          weekStart: e.weekStart,
          calendarJson: serializeCalendar(e.calendar),
          createdAt: e.createdAt,
        }))
      )
    );
  } catch {
    // ignore
  }
}
