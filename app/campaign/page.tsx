"use client";

import { useCallback, useEffect, useState } from "react";
import type { Config } from "@/app/types/calendar";
import Link from "next/link";
import { getEventsForWeek, type CalendarEvent } from "@/lib/calendar-events";
import { getWeekStart } from "@/lib/planning-algorithm";
import { DAY_NAMES_SHORT } from "@/app/components/calendar-constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

const STORAGE_KEY_CONFIG = "reddit-mastermind-config";
const CAMPAIGN_WEEKS = 4;

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

function getStableWeekStart(): Date {
  const d = new Date(2000, 0, 3);
  d.setHours(0, 0, 0, 0);
  return getWeekStart(d);
}

function getWeekLabel(weekStart: Date): string {
  const mon = new Date(weekStart);
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  return `${mon.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${sun.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export default function CampaignPage() {
  const [viewStart, setViewStart] = useState<Date>(getStableWeekStart);
  const [config, setConfig] = useState<Config | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setConfig(loadConfig());
    setViewStart(getWeekStart(new Date()));
    setLoaded(true);
  }, []);

  const getPersonName = useCallback(
    (id: string) => config?.people.find((p) => p.id === id)?.name ?? id,
    [config]
  );

  const goToday = useCallback(() => {
    setViewStart(getWeekStart(new Date()));
  }, []);

  const goPrev = useCallback(() => {
    setViewStart((s) => {
      const next = new Date(s);
      next.setDate(next.getDate() - CAMPAIGN_WEEKS * 7);
      return next;
    });
  }, []);

  const goNext = useCallback(() => {
    setViewStart((s) => {
      const next = new Date(s);
      next.setDate(next.getDate() + CAMPAIGN_WEEKS * 7);
      return next;
    });
  }, []);

  const weekStarts: Date[] = [];
  for (let i = 0; i < CAMPAIGN_WEEKS; i++) {
    const start = new Date(viewStart);
    start.setDate(start.getDate() + i * 7);
    weekStarts.push(start);
  }

  const weeksEvents = weekStarts.map((ws) => getEventsForWeek(ws));

  if (!loaded) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-muted-foreground">Loading campaign view…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <main className="mx-auto w-full max-w-6xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Campaign (4 weeks)</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToday} className="min-h-[44px] touch-manipulation">
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={goPrev} aria-label="Previous 4 weeks" className="min-w-[44px] min-h-[44px] touch-manipulation">
              ←
            </Button>
            <Button variant="outline" size="icon" onClick={goNext} aria-label="Next 4 weeks" className="min-w-[44px] min-h-[44px] touch-manipulation">
              →
            </Button>
          </div>
        </header>

        <Card>
          <CardContent className="p-0 overflow-hidden">
            <div className="overflow-x-auto touch-pan-x">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground min-w-[140px] sm:min-w-[160px] sticky left-0 bg-muted/50 z-10">
                      Week
                    </th>
                    {DAY_NAMES_SHORT.map((name, d) => (
                      <th key={d} className="py-2 px-2 text-center font-medium text-muted-foreground border-l border-border min-w-[72px] sm:min-w-[88px]">
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weekStarts.map((ws, wi) => {
                    const events = weeksEvents[wi];
                    const byDay: Record<number, CalendarEvent[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
                    for (const e of events) {
                      const d = e.date.getDay();
                      byDay[d].push(e);
                    }
                    return (
                      <tr key={wi} className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors">
                        <td className="py-2 px-3 font-medium text-muted-foreground align-top sticky left-0 bg-card z-10 border-r border-border">
                          <span className="text-xs sm:text-sm whitespace-nowrap">{getWeekLabel(ws)}</span>
                        </td>
                        {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                          <td key={d} className="py-1.5 px-2 border-l border-border align-top min-w-[72px] sm:min-w-[88px] min-h-[48px]">
                            <div className="flex flex-col gap-1">
                              {byDay[d].slice(0, 3).map((ev) => (
                                <button
                                  key={ev.item.id}
                                  type="button"
                                  className="text-left text-[10px] sm:text-xs rounded px-1.5 py-1 bg-primary/10 hover:bg-primary/20 active:bg-primary/25 text-foreground truncate border border-primary/20 touch-manipulation w-full"
                                  onClick={() => setSelectedEvent(ev)}
                                  title={`${ev.item.subreddit}: ${ev.item.query}`}
                                >
                                  <span className="font-medium text-muted-foreground">{ev.item.subreddit}</span>
                                  <span className="mx-0.5">·</span>
                                  <span className="truncate">{ev.item.query}</span>
                                </button>
                              ))}
                              {byDay[d].length > 3 && (
                                <span className="text-[10px] text-muted-foreground px-1">+{byDay[d].length - 3}</span>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-sm text-muted-foreground">
          <Link href="/" className="underline hover:text-foreground">Planner</Link>
          {" · "}
          <Link href="/calendar" className="underline hover:text-foreground">Calendar</Link>
        </p>

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
                    <Link href={`/?week=${selectedEvent.weekStart.toISOString().slice(0, 10)}`}>
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
