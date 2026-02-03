"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 items-center justify-between">
        <Link
          href="/"
          className="font-semibold text-foreground hover:text-foreground/80 transition-colors"
        >
          Reddit Mastermind
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
