"use client";

import type { ContentCalendar } from "@/app/types/calendar";
import { loadCalendarHistory, removeFromCalendarHistory, type CalendarHistoryEntry } from "@/lib/calendar-history";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { History, Trash2 } from "lucide-react";
import { useState } from "react";

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart);
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

interface CalendarHistoryPanelProps {
  onOpen: (calendar: ContentCalendar) => void;
  onExportExcel?: (calendar: ContentCalendar) => void;
  onExportCsv?: (calendar: ContentCalendar) => void;
  onExportJson?: (calendar: ContentCalendar) => void;
}

export function CalendarHistoryPanel({
  onOpen,
  onExportExcel,
  onExportCsv,
  onExportJson,
}: CalendarHistoryPanelProps) {
  const [entries, setEntries] = useState<CalendarHistoryEntry[]>(() => loadCalendarHistory());

  const refresh = () => setEntries(loadCalendarHistory());

  const handleDelete = (id: string) => {
    removeFromCalendarHistory(id);
    refresh();
  };

  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="size-4" />
          Calendar history
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5 max-h-[200px] overflow-y-auto">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
              <span className="text-muted-foreground truncate flex-1">{formatWeekLabel(e.weekStart)}</span>
              <div className="flex items-center gap-1 shrink-0">
                <Button type="button" variant="ghost" size="sm" onClick={() => onOpen(e.calendar)}>
                  Open
                </Button>
                {(onExportExcel || onExportCsv || onExportJson) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="ghost" size="sm">
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onExportExcel && (
                        <DropdownMenuItem onSelect={() => onExportExcel(e.calendar)}>Excel</DropdownMenuItem>
                      )}
                      {onExportCsv && (
                        <DropdownMenuItem onSelect={() => onExportCsv(e.calendar)}>CSV</DropdownMenuItem>
                      )}
                      {onExportJson && (
                        <DropdownMenuItem onSelect={() => onExportJson(e.calendar)}>JSON</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Remove from history"
                  onClick={() => handleDelete(e.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
