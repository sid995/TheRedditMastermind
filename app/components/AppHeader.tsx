"use client";

import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { ThemePicker } from "@/components/theme-picker";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/app/contexts/OnboardingContext";

export function AppHeader() {
  const { openOnboarding } = useOnboarding();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 items-center justify-between">
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="font-semibold text-foreground hover:text-foreground/80 transition-colors"
          >
            Reddit Mastermind
          </Link>
          <Link
            href="/calendar"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Calendar
          </Link>
        </nav>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
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
