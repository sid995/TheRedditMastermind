"use client";

import type { ContentCalendar, Person, CalendarItem } from "@/app/types/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarItemCard } from "./CalendarItemCard";
import { DAY_NAMES_SHORT } from "./calendar-constants";

const DAY_ORDER = [0, 1, 2, 3, 4, 5, 6]; // Sun..Sat

/** weekStart is Monday; dayOfWeek 0=Sun, 1=Mon, ... 6=Sat. Return the date for that day. */
function getDateForDay(weekStart: Date, dayOfWeek: number): Date {
  const d = new Date(weekStart);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + (dayOfWeek === 0 ? -1 : dayOfWeek - 1));
  return d;
}

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
      <div className="overflow-x-auto rounded-lg border border-border">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-7 border-b border-border bg-muted/50">
            {DAY_ORDER.map((dayOfWeek) => {
              const dayDate = getDateForDay(weekStart, dayOfWeek);
              return (
                <div
                  key={dayOfWeek}
                  className="py-2 text-center text-xs font-medium text-muted-foreground border-r border-border last:border-r-0"
                >
                  {DAY_NAMES_SHORT[dayOfWeek]} {dayDate.getDate()}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7 bg-card min-h-[320px]">
            {DAY_ORDER.map((dayOfWeek) => (
              <div
                key={dayOfWeek}
                className="flex flex-col gap-2 border-r border-border last:border-r-0 p-2 min-h-0"
              >
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
                  <p className="text-sm text-muted-foreground py-2">No posts</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
