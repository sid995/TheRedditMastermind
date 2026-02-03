"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
  { value: "sepia", label: "Sepia", icon: BookOpen },
] as const;

export function ThemePicker() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="size-10 min-w-[44px] min-h-[44px] sm:size-9" aria-label="Theme">
        <Sun className="size-4" />
      </Button>
    );
  }

  const displayTheme = theme === "system" ? resolvedTheme ?? "light" : theme ?? "light";
  const Icon = displayTheme === "dark" ? Moon : displayTheme === "sepia" ? BookOpen : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-10 min-w-[44px] min-h-[44px] sm:size-9" aria-label="Choose theme">
          <Icon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map(({ value, label, icon: ThemeIcon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
          >
            <ThemeIcon className="size-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
