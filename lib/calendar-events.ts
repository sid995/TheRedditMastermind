import type { CalendarItem, ContentCalendar } from "@/app/types/calendar";
import { loadCalendarHistory } from "./calendar-history";

const STORAGE_KEY_CALENDAR = "reddit-mastermind-calendar";

function loadCurrentCalendar(): ContentCalendar | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CALENDAR);
    if (!raw) return null;
    const data = JSON.parse(raw) as ContentCalendar & { weekStart: string };
    return {
      weekStart: new Date(data.weekStart),
      items: data.items,
    };
  } catch {
    return null;
  }
}

/** Get the calendar date (year/month/day) for an item: weekStart is Monday, dayOfWeek 0=Sun..6=Sat */
function getEventDate(weekStart: Date, dayOfWeek: number): Date {
  const d = new Date(weekStart);
  d.setHours(0, 0, 0, 0);
  // Sunday=0 -> weekStart-1, Monday=1 -> weekStart, Tuesday=2 -> weekStart+1, ...
  const offset = dayOfWeek === 0 ? -1 : dayOfWeek - 1;
  d.setDate(d.getDate() + offset);
  return d;
}

export interface CalendarEvent {
  date: Date;
  item: CalendarItem;
  calendar: ContentCalendar;
  weekStart: Date;
}

function eventsFromCalendar(calendar: ContentCalendar): CalendarEvent[] {
  const weekStart = new Date(calendar.weekStart);
  return calendar.items.map((item) => ({
    date: getEventDate(weekStart, item.dayOfWeek),
    item,
    calendar,
    weekStart: new Date(weekStart),
  }));
}

/** Load current calendar + history, flatten to events. Dedupe by weekStart ISO + item.id. */
export function getAllEvents(): CalendarEvent[] {
  const seen = new Set<string>();
  const out: CalendarEvent[] = [];
  const current = loadCurrentCalendar();
  if (current) {
    const weekKey = new Date(current.weekStart).toISOString();
    for (const e of eventsFromCalendar(current)) {
      const key = `${weekKey}-${e.item.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(e);
      }
    }
  }
  for (const entry of loadCalendarHistory()) {
    const weekKey = entry.weekStart;
    for (const e of eventsFromCalendar(entry.calendar)) {
      const key = `${weekKey}-${e.item.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(e);
      }
    }
  }
  return out;
}

/** Events that fall in the given month (local year/month). */
export function getEventsForMonth(year: number, month: number): CalendarEvent[] {
  return getAllEvents().filter((e) => {
    const d = e.date;
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

/** Events that fall in the 7-day window starting at weekStart (Monday 00:00). */
export function getEventsForWeek(weekStart: Date): CalendarEvent[] {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return getAllEvents().filter((e) => {
    const t = e.date.getTime();
    return t >= start.getTime() && t <= end.getTime();
  });
}
