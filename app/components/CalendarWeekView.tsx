"use client";

import type { ContentCalendar, Person } from "@/app/types/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <h2 className="text-xl font-semibold text-foreground">
          Content calendar
        </h2>
        <p className="text-sm text-muted-foreground">
          {formatDate(weekStart)} – {formatDate(weekEnd)}
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {DAY_ORDER.map((dayOfWeek) => (
          <Card key={dayOfWeek}>
            <CardHeader className="py-4">
              <CardTitle className="text-base">{getDayName(dayOfWeek)}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0">
              {itemsByDay[dayOfWeek]?.length ? (
                itemsByDay[dayOfWeek].map((item) => (
                  <CalendarItemCard key={item.id} item={item} getPersonName={getPersonName} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No posts</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
