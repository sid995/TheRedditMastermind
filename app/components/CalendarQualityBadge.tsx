"use client";

import { useState } from "react";
import type { QualityScore } from "@/lib/calendar-quality";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Info } from "lucide-react";

const BREAKDOWN_LABELS: Record<keyof QualityScore["breakdown"], string> = {
  subredditCap: "Subreddit cap",
  queryDiversity: "Query diversity",
  authorBalance: "Author balance",
  replyBalance: "Reply balance",
  noSelfReply: "No self-reply",
  daySpread: "Day spread",
};

function getHint(breakdown: QualityScore["breakdown"]): string | null {
  if (breakdown.daySpread < 1) return "Spread posts across more days.";
  if (breakdown.authorBalance < 1) return "Balance author assignments.";
  if (breakdown.replyBalance < 1) return "Balance reply assignments.";
  if (breakdown.noSelfReply < 1) return "Avoid author replying to own post.";
  if (breakdown.subredditCap < 1) return "Reduce posts per subreddit.";
  if (breakdown.queryDiversity < 1) return "Use more query variety.";
  return null;
}

interface CalendarQualityBadgeProps {
  quality: QualityScore;
  className?: string;
}

export function CalendarQualityBadge({ quality, className = "" }: CalendarQualityBadgeProps) {
  const [expanded, setExpanded] = useState(false);
  const hint = getHint(quality.breakdown);
  const scoreColor =
    quality.score >= 8 ? "text-green-600 dark:text-green-400" : quality.score >= 6 ? "text-foreground" : "text-amber-600 dark:text-amber-400";

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Quality</span>
        <span className={`text-sm font-semibold ${scoreColor}`}>{quality.score}/10</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-0.5 px-1.5 text-muted-foreground"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
        >
          {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          <span className="text-xs">{expanded ? "Hide" : "Details"}</span>
        </Button>
      </div>
      {hint && quality.score < 8 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
          <Info className="size-3.5 shrink-0" />
          {hint}
        </p>
      )}
      {expanded && (
        <ul className="mt-1 space-y-0.5 rounded-md border border-border bg-muted/30 px-2 py-1.5 text-xs">
          {(Object.keys(BREAKDOWN_LABELS) as (keyof QualityScore["breakdown"])[]).map((key) => (
            <li key={key} className="flex justify-between gap-4">
              <span className="text-muted-foreground">{BREAKDOWN_LABELS[key]}</span>
              <span className="font-medium">{quality.breakdown[key] === 1 ? "OK" : (quality.breakdown[key] * 100).toFixed(0) + "%"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
