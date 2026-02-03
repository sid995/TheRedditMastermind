"use client";

import type { ContentCalendar, Person, CalendarItem } from "@/app/types/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarItemCard, getDayName } from "./CalendarItemCard";

const DAY_ORDER = [0, 1, 2, 3, 4, 5, 6]; // Sun..Sat

interface CalendarWeekViewProps {
  calendar: ContentCalendar;
  people: Person[];
  editable?: boolean;
  onCalendarChange?: (calendar: ContentCalendar) => void;
}

export function CalendarWeekView({ calendar, people, editable, onCalendarChange }: CalendarWeekViewProps) {
  const personMap = Object.fromEntries(people.map((p) => [p.id, p]));
  const getPersonName = (id: string) => personMap[id]?.name ?? id;

  const itemsByDay: Record<number, CalendarItem[]> = {};
  for (const d of DAY_ORDER) {
    itemsByDay[d] = calendar.items.filter((i) => i.dayOfWeek === d);
  }

  const weekStart = new Date(calendar.weekStart);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const handleItemSave = (updated: CalendarItem) => {
    if (!onCalendarChange) return;
    const items = calendar.items.map((i) => (i.id === updated.id ? updated : i));
    onCalendarChange({
      ...calendar,
      items,
    });
  };

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
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7">
        {DAY_ORDER.map((dayOfWeek) => (
          <Card key={dayOfWeek}>
            <CardHeader className="py-3 sm:py-4 px-3 sm:px-6">
              <CardTitle className="text-sm sm:text-base">{getDayName(dayOfWeek)}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
              {itemsByDay[dayOfWeek]?.length ? (
                itemsByDay[dayOfWeek].map((item) => (
                  <CalendarItemCard
                    key={item.id}
                    item={item}
                    people={people}
                    getPersonName={getPersonName}
                    editable={editable}
                    onSave={editable ? handleItemSave : undefined}
                  />
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
