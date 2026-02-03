"use client";

import { useCallback, useEffect, useState } from "react";
import type { Config } from "@/app/types/calendar";
import Link from "next/link";
import { getAllEvents, getEventsForMonth, getEventsForWeek, type CalendarEvent } from "@/lib/calendar-events";
import { getWeekStart } from "@/lib/planning-algorithm";
import { DAY_NAMES_SHORT } from "@/app/components/calendar-constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STORAGE_KEY_CONFIG = "reddit-mastermind-config";

function loadConfig(): Config | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) return null;
    return JSON.parse(raw) as Config;
  } catch {
    return null;
  }
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getFirstSunday(year: number, month: number): Date {
  const d = new Date(year, month, 1);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

/** For column d (0=Sun..6=Sat), get the date given Monday weekStart */
function getDayDateInWeek(weekStart: Date, d: number): Date {
  const date = new Date(weekStart);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + (d === 0 ? -1 : d - 1));
  return date;
}

function getWeekLabel(weekStart: Date): string {
  const mon = new Date(weekStart);
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  return `Week of ${mon.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} – ${sun.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}`;
}

/** Stable initial date so server and client render the same (avoids hydration mismatch) */
function getStableFirstOfMonth(): Date {
  const d = new Date(2000, 0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function CalendarPage() {
  const [viewDate, setViewDate] = useState<Date>(getStableFirstOfMonth);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [allEventsCount, setAllEventsCount] = useState(0);
  const [config, setConfig] = useState<Config | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date(2000, 0, 3)));
  const [today, setToday] = useState<Date>(() => new Date(2000, 0, 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  useEffect(() => {
    setConfig(loadConfig());
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    first.setHours(0, 0, 0, 0);
    setViewDate(first);
    setWeekStart(getWeekStart(now));
    const t = new Date(now);
    t.setHours(0, 0, 0, 0);
    setToday(t);
    setEvents(getEventsForMonth(first.getFullYear(), first.getMonth()));
    setAllEventsCount(getAllEvents().length);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (year === 2000 && month === 0) return;
    setEvents(getEventsForMonth(year, month));
    setAllEventsCount(getAllEvents().length);
  }, [year, month]);

  const goPrevMonth = useCallback(() => {
    setViewDate((d) => {
      const next = new Date(d);
      next.setMonth(next.getMonth() - 1);
      next.setDate(1);
      next.setHours(0, 0, 0, 0);
      return next;
    });
  }, []);

  const goNextMonth = useCallback(() => {
    setViewDate((d) => {
      const next = new Date(d);
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      next.setHours(0, 0, 0, 0);
      return next;
    });
  }, []);

  const goToday = useCallback(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    setViewDate(d);
    setWeekStart(getWeekStart(new Date()));
  }, []);

  const goPrevWeek = useCallback(() => {
    setWeekStart((w) => {
      const next = new Date(w);
      next.setDate(next.getDate() - 7);
      return next;
    });
  }, []);

  const goNextWeek = useCallback(() => {
    setWeekStart((w) => {
      const next = new Date(w);
      next.setDate(next.getDate() + 7);
      return next;
    });
  }, []);

  const weekEvents = getEventsForWeek(weekStart);

  const startSunday = getFirstSunday(year, month);

  const getPersonName = useCallback(
    (id: string) => config?.people.find((p) => p.id === id)?.name ?? id,
    [config]
  );

  if (!loaded) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-muted-foreground">Loading calendar…</p>
        </main>
      </div>
    );
  }

  if (allEventsCount === 0) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-muted-foreground">
            No events. Generate calendars on the home page.
          </p>
          <Button variant="link" className="mt-2 px-0" asChild>
            <a href="/">Go to planner</a>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <main className="mx-auto w-full max-w-6xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Calendar</h1>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border border-border p-0.5">
              <Button
                variant={viewMode === "month" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("month")}
                className="min-h-[44px] min-w-[44px] touch-manipulation"
              >
                Month
              </Button>
              <Button
                variant={viewMode === "week" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => {
                  setViewMode("week");
                  setWeekStart(getWeekStart(viewDate));
                }}
                className="min-h-[44px] min-w-[44px] touch-manipulation"
              >
                Week
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToday} className="min-h-[44px] touch-manipulation">
              Today
            </Button>
            {viewMode === "month" ? (
              <>
                <Button variant="outline" size="icon" onClick={goPrevMonth} aria-label="Previous month" className="min-w-[44px] min-h-[44px] touch-manipulation">
                  <span className="sr-only">Previous month</span>
                  ←
                </Button>
                <span className="min-w-[100px] sm:min-w-[140px] text-center font-medium text-foreground text-sm px-1">
                  {getMonthLabel(viewDate)}
                </span>
                <Button variant="outline" size="icon" onClick={goNextMonth} aria-label="Next month" className="min-w-[44px] min-h-[44px] touch-manipulation">
                  <span className="sr-only">Next month</span>
                  →
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="icon" onClick={goPrevWeek} aria-label="Previous week" className="min-w-[44px] min-h-[44px] touch-manipulation">
                  <span className="sr-only">Previous week</span>
                  ←
                </Button>
                <span className="min-w-[120px] sm:min-w-[180px] text-center font-medium text-foreground text-xs sm:text-sm px-1">
                  {getWeekLabel(weekStart)}
                </span>
                <Button variant="outline" size="icon" onClick={goNextWeek} aria-label="Next week" className="min-w-[44px] min-h-[44px] touch-manipulation">
                  <span className="sr-only">Next week</span>
                  →
                </Button>
              </>
            )}
          </div>
        </header>

        {viewMode === "week" ? (
          <div className="overflow-x-auto -mx-1 px-1 rounded-lg border border-border touch-pan-x">
            <div className="min-w-[320px] grid grid-cols-7 border-b border-border bg-muted/50">
              {DAY_NAMES_SHORT.map((name, d) => {
                const dayDate = getDayDateInWeek(weekStart, d);
                const isTodayCol = isSameDay(dayDate, today);
                return (
                  <div
                    key={d}
                    className={`py-2 text-center text-xs font-medium border-r border-border last:border-r-0 ${isTodayCol ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
                  >
                    {name} {dayDate.getDate()}
                    {isTodayCol && (
                      <span className="block text-[10px] font-semibold text-primary mt-0.5">Today</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-7 bg-card min-h-[160px] sm:min-h-[200px]">
              {[0, 1, 2, 3, 4, 5, 6].map((d) => {
                const dayDate = getDayDateInWeek(weekStart, d);
                const isTodayCol = isSameDay(dayDate, today);
                const dayEvents = weekEvents.filter((e) => isSameDay(e.date, dayDate));
                return (
                  <div
                    key={d}
                    className={`min-h-[100px] sm:min-h-[120px] border-r border-border last:border-r-0 p-1 sm:p-1.5 flex flex-col ${isTodayCol ? "ring-1 ring-primary ring-inset bg-primary/5" : ""}`}
                  >
                    <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
                      {dayEvents.map((ev) => (
                        <button
                          key={ev.item.id}
                          type="button"
                          className="text-left text-[11px] sm:text-xs rounded px-1.5 py-2 sm:py-1 min-h-[44px] sm:min-h-0 bg-primary/10 hover:bg-primary/20 active:bg-primary/25 text-foreground truncate border border-primary/20 touch-manipulation"
                          onClick={() => setSelectedEvent(ev)}
                          title={`${ev.item.subreddit}: ${ev.item.query}`}
                        >
                          <span className="font-medium text-muted-foreground">{ev.item.subreddit}</span>
                          <span className="mx-1">·</span>
                          <span className="truncate">{ev.item.query}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
        <div className="overflow-x-auto -mx-1 px-1 rounded-lg border border-border touch-pan-x">
          <div className="min-w-[280px] grid grid-cols-7 border-b border-border bg-muted/50">
            {DAY_NAMES_SHORT.map((name) => (
              <div
                key={name}
                className="py-1.5 sm:py-2 px-0.5 text-center text-[10px] sm:text-xs font-medium text-muted-foreground border-r border-border last:border-r-0"
              >
                {name}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 bg-card min-w-[280px]">
            {Array.from({ length: 42 }, (_, i) => {
              const cellDate = new Date(startSunday);
              cellDate.setDate(startSunday.getDate() + i);
              const isCurrentMonth = cellDate.getMonth() === month;
              const isToday = isSameDay(cellDate, today);
              const dayEvents = events.filter((e) => isSameDay(e.date, cellDate));

              return (
                <div
                  key={i}
                  className={`min-h-[72px] sm:min-h-[100px] border-r border-b border-border last:border-r-0 p-1 sm:p-1.5 flex flex-col ${
                    isCurrentMonth ? "bg-card text-foreground" : "bg-muted/30 text-muted-foreground"
                  } ${isToday ? "ring-1 ring-primary ring-inset bg-primary/5" : ""}`}
                >
                  <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
                    <span
                      className={`text-xs sm:text-sm font-medium ${
                        isToday ? "bg-primary text-primary-foreground rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center shrink-0" : ""
                      }`}
                    >
                      {cellDate.getDate()}
                    </span>
                    {isToday && (
                      <span className="text-[9px] sm:text-[10px] font-medium text-primary bg-primary/15 px-1 py-0.5 rounded shrink-0">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 sm:mt-1 flex flex-col gap-0.5 sm:gap-1 overflow-y-auto flex-1 min-h-0">
                    {isCurrentMonth &&
                      dayEvents.map((ev) => (
                        <button
                          key={ev.item.id}
                          type="button"
                          className="text-left text-[10px] sm:text-xs rounded px-1 sm:px-1.5 py-2 sm:py-1 min-h-[40px] sm:min-h-0 bg-primary/10 hover:bg-primary/20 active:bg-primary/25 text-foreground truncate border border-primary/20 touch-manipulation"
                          onClick={() => setSelectedEvent(ev)}
                          title={`${ev.item.subreddit}: ${ev.item.query}`}
                        >
                          <span className="font-medium text-muted-foreground">{ev.item.subreddit}</span>
                          <span className="mx-1">·</span>
                          <span className="truncate">{ev.item.query}</span>
                        </button>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-6 rounded-lg">
            {selectedEvent && (
              <>
                <DialogHeader>
                  <DialogTitle>Post details</DialogTitle>
                </DialogHeader>
                <div className="grid gap-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Subreddit:</span>{" "}
                    {selectedEvent.item.subreddit}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Query:</span>{" "}
                    {selectedEvent.item.query}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Author:</span>{" "}
                    {getPersonName(selectedEvent.item.authorPersonId)}
                  </p>
                  {selectedEvent.item.replyAssignments.length > 0 && (
                    <p>
                      <span className="text-muted-foreground">Replies:</span>{" "}
                      {selectedEvent.item.replyAssignments
                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                        .map((r) => getPersonName(r.personId))
                        .join(", ")}
                    </p>
                  )}
                  <p className="text-muted-foreground text-xs mt-2">
                    {selectedEvent.date.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <Button asChild className="mt-4 min-h-[44px] w-full sm:w-auto touch-manipulation">
                    <Link
                      href={`/?week=${selectedEvent.weekStart.toISOString().slice(0, 10)}`}
                    >
                      Open week in planner
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
