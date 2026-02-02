"use client";

import type { ContentCalendar, Person } from "@/app/types/calendar";
import { CalendarItemCard, getDayName } from "./CalendarItemCard";

const DAY_ORDER = [0, 1, 2, 3, 4, 5, 6]; // Sun..Sat

interface CalendarWeekViewProps {
  calendar: ContentCalendar;
  people: Person[];
}

export function CalendarWeekView({ calendar, people }: CalendarWeekViewProps) {
  const personMap = Object.fromEntries(people.map((p) => [p.id, p]));
  const getPersonName = (id: string) => personMap[id]?.name ?? id;

  const itemsByDay: Record<number, typeof calendar.items> = {};
  for (const d of DAY_ORDER) {
    itemsByDay[d] = calendar.items.filter((i) => i.dayOfWeek === d);
  }

  const weekStart = new Date(calendar.weekStart);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Content calendar
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {formatDate(weekStart)} – {formatDate(weekEnd)}
        </p>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {DAY_ORDER.map((dayOfWeek) => (
          <section
            key={dayOfWeek}
            className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-600 dark:bg-zinc-800/30"
          >
            <h3 className="font-medium text-zinc-700 dark:text-zinc-300">
              {getDayName(dayOfWeek)}
            </h3>
            <ul className="flex flex-col gap-2">
              {itemsByDay[dayOfWeek]?.length ? (
                itemsByDay[dayOfWeek].map((item) => (
                  <li key={item.id}>
                    <CalendarItemCard item={item} getPersonName={getPersonName} />
                  </li>
                ))
              ) : (
                <li className="text-sm text-zinc-400 dark:text-zinc-500">
                  No posts
                </li>
              )}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
