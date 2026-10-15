import { Fragment } from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
  onNavigate?: (href: string) => void;
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={`${item.label}-${i}`}>
              {i > 0 ? (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              ) : null}
              <li className="min-w-0">
                {last || (!item.href && !item.onNavigate) ? (
                  <span aria-current="page" className="block truncate font-medium">
                    {item.label}
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      if (item.onNavigate && item.href) item.onNavigate(item.href);
                    }}
                    className="block max-w-40 truncate text-muted-foreground transition-colors duration-150 hover:text-foreground"
                  >
                    {item.label}
                  </button>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
