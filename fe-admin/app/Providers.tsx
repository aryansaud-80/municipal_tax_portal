"use client";

import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { ToastProvider } from "@/components/ui/toast";
import { applyThemeDom, usePrefs } from "@/lib/display-prefs";

function ThemeSync() {
  const prefs = usePrefs();
  useEffect(() => {
    applyThemeDom();
  }, [prefs.theme]);
  useEffect(() => {
    document.documentElement.lang = prefs.language === "ne" ? "ne" : "en";
  }, [prefs.language]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
