"use client";

import { useCallback, useState } from "react";
import type { Config, ContentCalendar } from "@/app/types/calendar";
import { generateCalendar, getNextWeekStart, getWeekStart } from "@/lib/planning-algorithm";
import { exportCalendarExcel } from "@/lib/excel-io";
import { ConfigForm } from "@/app/components/ConfigForm";
import { CalendarWeekView } from "@/app/components/CalendarWeekView";

function defaultConfig(): Config {
  return {
    company: { name: "", description: "", goal: "" },
    personas: [
      { id: "persona-1", name: "", description: "" },
      { id: "persona-2", name: "", description: "" },
    ],
    subreddits: [],
    queries: [],
    postsPerWeek: 5,
  };
}

export default function Home() {
  const [config, setConfig] = useState<Config>(defaultConfig);
  const [calendar, setCalendar] = useState<ContentCalendar | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date | null>(null);

  const handleGenerateCalendar = useCallback(() => {
    const weekStart = getWeekStart(new Date());
    const cal = generateCalendar(config, weekStart);
    setCalendar(cal);
    setCurrentWeekStart(new Date(cal.weekStart));
  }, [config]);

  const handleGenerateNextWeek = useCallback(() => {
    if (!config || !currentWeekStart) return;
    const nextStart = getNextWeekStart(currentWeekStart);
    const cal = generateCalendar(config, nextStart);
    setCalendar(cal);
    setCurrentWeekStart(new Date(cal.weekStart));
  }, [config, currentWeekStart]);

  const handleExportExcel = useCallback(() => {
    if (!calendar) return;
    const buf = exportCalendarExcel(config, calendar);
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `content-calendar-${calendar.weekStart.toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config, calendar]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Reddit Mastermind – Content Calendar
        </h1>

        <section className="mb-10">
          <ConfigForm
            config={config}
            onChange={setConfig}
            onSubmit={handleGenerateCalendar}
          />
        </section>

        {calendar && (
          <section className="space-y-4">
            <CalendarWeekView calendar={calendar} personas={config.personas} />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleGenerateNextWeek}
                className="rounded bg-zinc-700 px-4 py-2 font-medium text-white hover:bg-zinc-600 dark:bg-zinc-300 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Generate next week
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="rounded border border-zinc-300 bg-white px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                Export to Excel
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
