"use client";

import type { CalendarItem } from "@/app/types/calendar";

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
    <article className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-600 dark:bg-zinc-800/50">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium text-zinc-500 dark:text-zinc-400">
          r/{item.subreddit}
        </span>
        <span className="text-zinc-400 dark:text-zinc-500">·</span>
        <span className="text-zinc-700 dark:text-zinc-300">{item.query}</span>
      </div>
      <p className="mt-2 text-sm text-zinc-900 dark:text-zinc-100">
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
    </article>
  );
}

export function getDayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] ?? "Day";
}
