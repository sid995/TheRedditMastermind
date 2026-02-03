"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Config, ContentCalendar } from "@/app/types/calendar";
import { generateCalendar, getNextWeekStart, getWeekStart, duplicateCalendarToWeek } from "@/lib/planning-algorithm";
import { exportCalendarExcel, exportCalendarCsv, exportCalendarJson } from "@/lib/excel-io";
import { addToCalendarHistory, loadCalendarHistory } from "@/lib/calendar-history";
import { ConfigForm } from "@/app/components/ConfigForm";
import { ConfigTemplatePicker } from "@/app/components/ConfigTemplatePicker";
import { CalendarWeekView } from "@/app/components/CalendarWeekView";
import { CalendarHistoryPanel } from "@/app/components/CalendarHistoryPanel";
import { getOnboardingDone } from "@/app/components/OnboardingDialog";
import { useOnboarding } from "@/app/contexts/OnboardingContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarPlus, Copy, FileDown, CopyPlus } from "lucide-react";
import { toast } from "sonner";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const STORAGE_KEY_CALENDAR = "reddit-mastermind-calendar";

function loadCalendar(): ContentCalendar | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CALENDAR);
    if (!raw) return null;
    const data = JSON.parse(raw) as ContentCalendar;
    data.weekStart = new Date(data.weekStart);
    return data;
  } catch {
    return null;
  }
}

function buildCalendarSummary(calendar: ContentCalendar, getPersonName: (id: string) => string): string {
  const weekStart = new Date(calendar.weekStart);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const lines: string[] = [`Content calendar: ${fmt(weekStart)} – ${fmt(weekEnd)}`, ""];
  for (let d = 0; d <= 6; d++) {
    const dayItems = calendar.items.filter((i) => i.dayOfWeek === d);
    if (dayItems.length === 0) continue;
    lines.push(DAY_NAMES[d]);
    for (const item of dayItems) {
      const author = getPersonName(item.authorPersonId);
      const replies = item.replyAssignments
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((r) => getPersonName(r.personId));
      const replyStr = replies.length > 0 ? ` (Replies: ${replies.join(", ")})` : "";
      lines.push(`  - ${item.subreddit}: ${item.query} — ${author} posts${replyStr}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function defaultConfig(): Config {
  return {
    company: { name: "", description: "", goal: "" },
    people: [
      { id: "person-1", name: "", description: "" },
      { id: "person-2", name: "", description: "" },
    ],
    subreddits: "",
    queries: "",
    postsPerWeek: 5,
  };
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState<Config>(defaultConfig);
  const [calendar, setCalendar] = useState<ContentCalendar | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { openOnboarding } = useOnboarding();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const savedCalendar = loadCalendar();
    if (savedCalendar) {
      setCalendar(savedCalendar);
      setCurrentWeekStart(new Date(savedCalendar.weekStart));
    }
    setHydrated(true);
  }, [mounted]);

  useEffect(() => {
    if (!hydrated || !mounted) return;
    const weekParam = searchParams.get("week");
    if (!weekParam || !/^\d{4}-\d{2}-\d{2}$/.test(weekParam)) return;
    const history = loadCalendarHistory();
    const entry = history.find((e) => e.weekStart.slice(0, 10) === weekParam);
    if (entry) {
      setCalendar(entry.calendar);
      setCurrentWeekStart(new Date(entry.calendar.weekStart));
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, [hydrated, mounted, searchParams]);

  useEffect(() => {
    if (!hydrated || !mounted) return;
    if (!loadCalendar() && !getOnboardingDone()) {
      openOnboarding();
    }
  }, [hydrated, mounted, openOnboarding]);

  useEffect(() => {
    if (!hydrated || !calendar) return;
    try {
      localStorage.setItem(STORAGE_KEY_CALENDAR, JSON.stringify(calendar));
    } catch {
      // ignore
    }
  }, [calendar, hydrated]);

  const handleGenerateCalendar = useCallback(() => {
    setIsGenerating(true);
    const weekStart = getWeekStart(new Date());
    setTimeout(() => {
      const cal = generateCalendar(config, weekStart);
      setCalendar(cal);
      setCurrentWeekStart(new Date(cal.weekStart));
      addToCalendarHistory(cal);
      setIsGenerating(false);
      toast.success("Calendar generated");
    }, 0);
  }, [config]);

  const handleGenerateNextWeek = useCallback(() => {
    if (!config || !currentWeekStart) return;
    setIsGenerating(true);
    const nextStart = getNextWeekStart(currentWeekStart);
    setTimeout(() => {
      const cal = generateCalendar(config, nextStart);
      setCalendar(cal);
      setCurrentWeekStart(new Date(cal.weekStart));
      addToCalendarHistory(cal);
      setIsGenerating(false);
      toast.success("Next week generated");
    }, 0);
  }, [config, currentWeekStart]);

  const handleDuplicateWeek = useCallback(() => {
    if (!calendar) return;
    const nextStart = getNextWeekStart(currentWeekStart ?? new Date(calendar.weekStart));
    const cal = duplicateCalendarToWeek(calendar, nextStart);
    setCalendar(cal);
    setCurrentWeekStart(new Date(cal.weekStart));
    addToCalendarHistory(cal);
    toast.success("Week duplicated");
  }, [calendar, currentWeekStart]);

  const handleOpenFromHistory = useCallback((cal: ContentCalendar) => {
    setCalendar(cal);
    setCurrentWeekStart(new Date(cal.weekStart));
  }, []);

  const handleExportExcel = useCallback(
    (cal?: ContentCalendar) => {
      const target = cal ?? calendar;
      if (!target) return;
      const buf = exportCalendarExcel(config, target);
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `content-calendar-${target.weekStart.toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported to Excel");
    },
    [config, calendar]
  );

  const handleExportCsv = useCallback(
    (cal?: ContentCalendar) => {
      const target = cal ?? calendar;
      if (!target) return;
      const csv = exportCalendarCsv(config, target);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `content-calendar-${target.weekStart.toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported to CSV");
    },
    [config, calendar]
  );

  const handleExportJson = useCallback(
    (cal?: ContentCalendar) => {
      const target = cal ?? calendar;
      if (!target) return;
      const json = exportCalendarJson(config, target);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `content-calendar-${target.weekStart.toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported to JSON");
    },
    [config, calendar]
  );

  const handleCalendarChange = useCallback((updated: ContentCalendar) => {
    setCalendar(updated);
  }, []);

  // People for calendar display: config.people + any IDs referenced in calendar (e.g. from history) so author/reply dropdowns always have options
  const displayPeople = useMemo(() => {
    const fromConfig = config.people;
    if (!calendar) return fromConfig;
    const idsInCalendar = new Set<string>();
    for (const item of calendar.items) {
      idsInCalendar.add(item.authorPersonId);
      for (const r of item.replyAssignments) idsInCalendar.add(r.personId);
    }
    const fromCalendar = [...idsInCalendar].filter((id) => !fromConfig.some((p) => p.id === id)).map((id) => ({ id, name: id }));
    return [...fromConfig, ...fromCalendar];
  }, [config.people, calendar?.items]);
  const personMap = useMemo(() => Object.fromEntries(displayPeople.map((p) => [p.id, p])), [displayPeople]);
  const getPersonName = useCallback((id: string) => personMap[id]?.name ?? id, [personMap]);

  const handleCopySummary = useCallback(() => {
    if (!calendar) return;
    const text = buildCalendarSummary(calendar, getPersonName);
    void navigator.clipboard.writeText(text).then(() => {
      toast.success("Summary copied to clipboard");
    });
  }, [calendar, getPersonName]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        const target = e.target as HTMLElement;
        if (target.closest("form")) {
          e.preventDefault();
          const form = target.closest("form");
          if (form?.requestSubmit) form.requestSubmit();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!mounted) {
    return <HomeFallback />;
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <main className="flex flex-col">
        <div className="mx-auto w-full max-w-4xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6 sm:space-y-8">
          <header className="space-y-1">
            <p className="text-base sm:text-lg text-muted-foreground">
              Plan Reddit content and replies in one place
            </p>
          </header>

          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-lg">Configuration</CardTitle>
              <ConfigTemplatePicker
                config={config}
                onLoad={setConfig}
                disabled={isGenerating}
              />
            </CardHeader>
            <CardContent>
              <ConfigForm
                config={config}
                onChange={setConfig}
                onSubmit={handleGenerateCalendar}
                disabled={isGenerating}
                isGenerating={isGenerating}
              />
            </CardContent>
          </Card>

          <CalendarHistoryPanel
            onOpen={handleOpenFromHistory}
            onExportExcel={handleExportExcel}
            onExportCsv={handleExportCsv}
            onExportJson={handleExportJson}
          />

          {!calendar && !isGenerating && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No calendar yet. Fill in the configuration above and generate your first calendar.
                </p>
                <p className="text-sm text-muted-foreground">
                  Add company info, people, subreddits, and ChatGPT queries, then click &quot;Generate calendar&quot;.
                </p>
              </CardContent>
            </Card>
          )}

          {isGenerating && (
            <section className="w-full px-4 pb-8 sm:px-6 lg:px-8 xl:px-12">
              <div className="mx-auto w-full max-w-[1600px]">
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div className="flex flex-col gap-6">
                      <header className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="h-7 w-48 rounded bg-muted animate-pulse" />
                        <div className="h-5 w-32 rounded bg-muted animate-pulse" />
                      </header>
                      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7">
                        {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                          <Card key={d}>
                            <CardHeader className="py-4">
                              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2 pt-0">
                              <div className="h-16 rounded bg-muted/80 animate-pulse" />
                              <div className="h-16 rounded bg-muted/80 animate-pulse" />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="h-9 w-36 rounded-md bg-muted animate-pulse" />
                      <div className="h-9 w-32 rounded-md bg-muted animate-pulse" />
                      <div className="h-9 w-28 rounded-md bg-muted animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          )}
        </div>

        {calendar && !isGenerating && (
          <section className="w-full px-3 pb-6 sm:px-6 sm:pb-8 lg:px-8 xl:px-12">
            <div className="mx-auto w-full max-w-[1600px]">
              <Card>
                <CardContent className="pt-4 px-3 sm:pt-6 sm:px-6 space-y-4 sm:space-y-6">
                  <CalendarWeekView
                    calendar={calendar}
                    people={displayPeople}
                    onCalendarChange={handleCalendarChange}
                    editable
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleGenerateNextWeek} size="default" className="min-h-[44px] touch-manipulation shrink-0">
                      <CalendarPlus className="size-4 shrink-0" />
                      <span className="hidden sm:inline">Generate next week</span>
                      <span className="sm:hidden">Next week</span>
                    </Button>
                    <Button onClick={handleDuplicateWeek} variant="outline" size="default" className="min-h-[44px] touch-manipulation">
                      <CopyPlus className="size-4" />
                      Duplicate week
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="default" className="min-h-[44px] touch-manipulation">
                          <FileDown className="size-4" />
                          Export
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="max-h-[min(70vh,400px)] overflow-y-auto">
                        <DropdownMenuItem onSelect={() => handleExportExcel()}>Excel</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleExportCsv()}>CSV</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleExportJson()}>JSON</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button onClick={handleCopySummary} variant="outline" size="default" className="min-h-[44px] touch-manipulation">
                      <Copy className="size-4" />
                      Copy summary
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function HomeFallback() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <main className="flex flex-col">
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent />
    </Suspense>
  );
}
