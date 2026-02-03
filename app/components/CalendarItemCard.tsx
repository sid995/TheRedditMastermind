"use client";

import { useState } from "react";
import type { CalendarItem, Person } from "@/app/types/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { CalendarItemEditDialog } from "./CalendarItemEditDialog";
import { DAY_NAMES } from "./calendar-constants";

interface CalendarItemCardProps {
  item: CalendarItem;
  people: Person[];
  getPersonName: (id: string) => string;
  editable?: boolean;
  onSave?: (updated: CalendarItem) => void;
  onDelete?: (item: CalendarItem) => void;
}

export function CalendarItemCard({ item, people, getPersonName, editable, onSave, onDelete }: CalendarItemCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const resolved =
    (item.authorPersonId && getPersonName(item.authorPersonId).trim()) ||
    (item.authorPersonId && item.authorPersonId.trim()) ||
    "Unknown";

  return (
    <>
      <Card className="relative">
        <CardContent className="pt-8 py-2 px-2.5 sm:py-3 sm:px-6 sm:pt-8">
          {editable && (onSave || onDelete) && (
            <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex items-center gap-0.5">
              {onSave && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 min-w-7 min-h-7 p-0 rounded touch-manipulation"
                  aria-label="Edit post"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="size-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 min-w-7 min-h-7 p-0 rounded touch-manipulation text-destructive hover:text-destructive hover:bg-destructive/10"
                  aria-label="Delete post"
                  onClick={() => onDelete(item)}
                >
                  <Trash2 className="size-3" />
                </Button>
              )}
            </div>
          )}
          <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[11px] sm:text-sm">
                <span className="font-medium text-muted-foreground truncate max-w-[80px] sm:max-w-none">
                  {item.subreddit}
                </span>
                <span className="text-foreground truncate">{item.query}</span>
              </div>
              <p className="mt-1 sm:mt-2 text-[11px] sm:text-sm text-muted-foreground">
                Post by <strong className="text-card-foreground">{resolved}</strong>
              </p>
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
          onDelete={onDelete ? () => { onDelete(item); setEditOpen(false); } : undefined}
        />
      )}
    </>
  );
}

export function getDayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] ?? "Day";
}
