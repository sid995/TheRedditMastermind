"use client";

import type { CalendarItem, Person, ReplyAssignment } from "@/app/types/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DAY_NAMES } from "./calendar-constants";

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

interface CalendarItemEditDialogProps {
  item: CalendarItem;
  people: Person[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updated: CalendarItem) => void;
  onDelete?: () => void;
}

export function CalendarItemEditDialog({
  item,
  people,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: CalendarItemEditDialogProps) {
  const reply1 = item.replyAssignments.find((r) => r.order === 1);
  const reply2 = item.replyAssignments.find((r) => r.order === 2);
  // Reply options: all people (we filter author in onSave so author cannot self-reply)
  const replyOptions = people;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const subreddit = (form.elements.namedItem("subreddit") as HTMLInputElement)?.value?.trim() ?? item.subreddit;
    const query = (form.elements.namedItem("query") as HTMLInputElement)?.value?.trim() ?? item.query;
    const authorId = (form.elements.namedItem("author") as HTMLSelectElement)?.value ?? item.authorPersonId;
    const dayStr = (form.elements.namedItem("day") as HTMLSelectElement)?.value ?? String(item.dayOfWeek);
    const dayOfWeek = Math.max(0, Math.min(6, parseInt(dayStr, 10) || 0));
    const reply1Id = (form.elements.namedItem("reply1") as HTMLSelectElement)?.value ?? "";
    const reply2Id = (form.elements.namedItem("reply2") as HTMLSelectElement)?.value ?? "";
    const replyAssignments: ReplyAssignment[] = [];
    if (reply1Id && reply1Id !== authorId) replyAssignments.push({ personId: reply1Id, order: 1 });
    if (reply2Id && reply2Id !== authorId && reply2Id !== reply1Id)
      replyAssignments.push({ personId: reply2Id, order: 2 });
    onSave({
      ...item,
      subreddit,
      query,
      authorPersonId: authorId,
      dayOfWeek,
      replyAssignments: replyAssignments.length > 0 ? replyAssignments : item.replyAssignments,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit post</DialogTitle>
        </DialogHeader>
        <form id="edit-item-form" onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="edit-subreddit">Subreddit</Label>
            <Input
              id="edit-subreddit"
              name="subreddit"
              defaultValue={item.subreddit}
              placeholder="r/..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-query">Query</Label>
            <Input
              id="edit-query"
              name="query"
              defaultValue={item.query}
              placeholder="ChatGPT query"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-day">Day</Label>
            <select id="edit-day" name="day" defaultValue={item.dayOfWeek} className={selectClassName}>
              {DAY_NAMES.map((name, i) => (
                <option key={i} value={i}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-author">Author</Label>
            <select id="edit-author" name="author" defaultValue={item.authorPersonId} className={selectClassName}>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name?.trim() || p.id || "Unnamed"}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label>Replies</Label>
            <p className="text-xs text-muted-foreground">Choose who replies to this post (1–2 people, different from the author).</p>
            <div className="flex gap-2">
              <select name="reply1" defaultValue={reply1?.personId ?? ""} className={selectClassName}>
                <option value="">None</option>
                {replyOptions.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === item.authorPersonId}>
                    {p.name?.trim() || p.id || "Unnamed"}
                  </option>
                ))}
              </select>
              <select name="reply2" defaultValue={reply2?.personId ?? ""} className={selectClassName}>
                <option value="">None</option>
                {replyOptions.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === item.authorPersonId}>
                    {p.name?.trim() || p.id || "Unnamed"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          {onDelete ? (
            <Button
              type="button"
              variant="destructive"
              className="order-2 sm:order-1 w-full sm:w-auto min-h-[44px] touch-manipulation"
              onClick={() => { onDelete(); onOpenChange(false); }}
            >
              Delete post
            </Button>
          ) : null}
          <div className="flex gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="min-h-[44px] touch-manipulation">
              Cancel
            </Button>
            <Button type="submit" form="edit-item-form" className="min-h-[44px] touch-manipulation">
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
