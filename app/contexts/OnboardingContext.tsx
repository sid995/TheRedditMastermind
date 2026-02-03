"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { OnboardingDialog } from "@/app/components/OnboardingDialog";

interface OnboardingContextValue {
  openOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openOnboarding = useCallback(() => setOpen(true), []);

  return (
    <OnboardingContext.Provider value={{ openOnboarding }}>
      {children}
      <OnboardingDialog open={open} onOpenChange={setOpen} />
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) return { openOnboarding: () => {} };
  return ctx;
}
