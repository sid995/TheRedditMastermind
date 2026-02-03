"use client";

import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { ThemePicker } from "@/components/theme-picker";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/app/contexts/OnboardingContext";

export function AppHeader() {
  const { openOnboarding } = useOnboarding();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-inset-top">
      <div className="container flex h-14 min-h-[3.5rem] max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 items-center justify-between gap-2">
        <nav className="flex items-center gap-3 sm:gap-6 min-w-0">
          <Link
            href="/"
            className="font-semibold text-foreground hover:text-foreground/80 transition-colors text-sm sm:text-base truncate"
          >
            Reddit Mastermind
          </Link>
          <Link
            href="/calendar"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0 py-2 px-1 -mx-1 rounded-md touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            Calendar
          </Link>
        </nav>
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-10 min-w-[44px] min-h-[44px] sm:size-9"
            aria-label="Help"
            onClick={openOnboarding}
          >
            <HelpCircle className="size-4" />
          </Button>
          <ThemePicker />
        </div>
      </div>
    </header>
  );
}
