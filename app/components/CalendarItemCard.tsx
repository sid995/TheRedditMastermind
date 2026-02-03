"use client";

import { useState } from "react";
import type { CalendarItem, Person } from "@/app/types/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { CalendarItemEditDialog } from "./CalendarItemEditDialog";
import { DAY_NAMES } from "./calendar-constants";

interface CalendarItemCardProps {
  item: CalendarItem;
  people: Person[];
  getPersonName: (id: string) => string;
  editable?: boolean;
  onSave?: (updated: CalendarItem) => void;
}

export function CalendarItemCard({ item, people, getPersonName, editable, onSave }: CalendarItemCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const authorName = getPersonName(item.authorPersonId);
  const replyNames = item.replyAssignments
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((r) => getPersonName(r.personId));

  return (
    <>
      <Card>
        <CardContent className="py-2.5 sm:py-3 px-3 sm:px-6">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
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
            </div>
            {editable && onSave && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                aria-label="Edit post"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="size-3.5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      {editable && onSave && (
        <CalendarItemEditDialog
          item={item}
          people={people}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSave={(updated) => {
            onSave(updated);
            setEditOpen(false);
          }}
        />
      )}
    </>
  );
}

export function getDayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] ?? "Day";
}
