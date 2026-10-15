"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useStrings } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface PalettePage {
  href: string;
  label: string;
  hint?: string;
}

export function CommandPalette({
  open,
  onOpenChange,
  pages,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pages: PalettePage[];
}) {
  const s = useStrings();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        (p.hint ?? "").toLowerCase().includes(q),
    );
  }, [query, pages]);

  // Fresh state per open cycle is provided by the parent via `key`.
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[18%] max-w-lg translate-y-0 gap-0 p-0"
      >
        <DialogTitle className="sr-only">{s.search}</DialogTitle>
        <div className="flex items-center gap-2 border-b px-4">
          <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground" aria-hidden />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter" && results[active]) {
                go(results[active].href);
              }
            }}
            placeholder={s.searchPlaceholder}
            aria-label={s.search}
            className="h-12 border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
        </div>
        <ul role="listbox" aria-label={s.search} className="max-h-72 overflow-y-auto p-2 scrollbar-slim">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              {s.searchEmpty}
            </li>
          ) : (
            results.map((page, i) => (
              <li key={page.href}>
                <button
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(page.href)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm transition-colors duration-150",
                    i === active ? "bg-primary-soft text-foreground" : "text-foreground",
                  )}
                >
                  <span className="flex-1">
                    <span className="block font-medium">{page.label}</span>
                    {page.hint ? (
                      <span className="block text-xs text-muted-foreground">{page.hint}</span>
                    ) : null}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                </button>
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
