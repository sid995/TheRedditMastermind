"use client";

import type { CalendarItem } from "@/app/types/calendar";
import { Card, CardContent } from "@/components/ui/card";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface CalendarItemCardProps {
  item: CalendarItem;
  getPersonName: (id: string) => string;
}

export function CalendarItemCard({ item, getPersonName }: CalendarItemCardProps) {
  const authorName = getPersonName(item.authorPersonId);
  const replyNames = item.replyAssignments
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((r) => getPersonName(r.personId));

  return (
    <Card>
      <CardContent className="py-2.5 sm:py-3 px-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
          <span className="font-medium text-muted-foreground">
            {item.subreddit}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-foreground">{item.query}</span>
        </div>
        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-card-foreground">
          <strong>{authorName}</strong> posts
          {replyNames.length > 0 && (
            <>
              ;{" "}
              {replyNames.map((name, i) => (
                <span key={name}>
                  {i > 0 && " and "}
                  <strong>{name}</strong>
                </span>
              ))}{" "}
              reply
            </>
          )}
          .
        </p>
      </CardContent>
    </Card>
  );
}

export function getDayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] ?? "Day";
}
