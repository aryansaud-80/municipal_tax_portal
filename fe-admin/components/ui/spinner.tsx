import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <LoaderCircle
      role="status"
      aria-label="Loading"
      className={cn("h-5 w-5 animate-spin text-primary", className)}
    />
  );
}
