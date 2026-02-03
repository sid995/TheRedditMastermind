import * as XLSX from "xlsx";
import type { Config, ContentCalendar } from "@/app/types/calendar";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parseList(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Export config + content calendar to SlideForge-style output Excel */
export function exportCalendarExcel(config: Config, calendar: ContentCalendar): ArrayBuffer {
  const { company, people, subreddits, queries } = config;
  const rows: (string | number)[][] = [];

  rows.push(["Name", company.name]);
  rows.push(["Website", company.website ?? ""]);
  rows.push(["Description", company.description ?? ""]);
  rows.push(["Subreddits", subreddits]);
  rows.push(["Number of posts per week", calendar.items.length]);
  rows.push([""]);
  rows.push([""]);

  rows.push(["Username", "Info"]);
  for (const p of people) {
    rows.push([p.name, p.description ?? ""]);
  }
  rows.push([""]);
  rows.push([""]);

  rows.push(["keyword_id", "keyword"]);
  parseList(queries).forEach((q, idx) => {
    rows.push([`K${idx + 1}`, q]);
  });
  rows.push([""]);
  rows.push([""]);

  rows.push(["post_id", "subreddit", "title", "body", "author_username", "timestamp", "keyword_ids"]);
  const personById = Object.fromEntries(config.people.map((p) => [p.id, p]));
  calendar.items.forEach((item, idx) => {
    const authorName = personById[item.authorPersonId]?.name ?? item.authorPersonId;
    const dayName = DAY_NAMES[item.dayOfWeek] ?? "";
    rows.push([
      `P${idx + 1}`,
      item.subreddit,
      item.query,
      "",
      authorName,
      dayName,
      item.query,
    ]);
  });
  rows.push([""]);
  rows.push(["comment_id", "parent_comment_id", "comment_text", "username"]);
  rows.push([""]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Content Calendar");
  return XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
}
