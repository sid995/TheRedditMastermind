"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "reddit-mastermind-onboarding-done";

export function getOnboardingDone(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setOnboardingDone(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // ignore
  }
}

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGotIt?: () => void;
}

export function OnboardingDialog({ open, onOpenChange, onGotIt }: OnboardingDialogProps) {
  const handleGotIt = () => {
    setOnboardingDone();
    onOpenChange(false);
    onGotIt?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>How to use Reddit Mastermind</DialogTitle>
          <DialogDescription asChild>
            <div className="mt-2 text-left">
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>Fill in company info, people, subreddits, and ChatGPT queries.</li>
                <li>Click &quot;Generate calendar&quot; (or press Ctrl+Enter) to create your week.</li>
                <li>View the calendar, export to Excel, copy the summary, or generate the next week.</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
          <Button onClick={handleGotIt}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
