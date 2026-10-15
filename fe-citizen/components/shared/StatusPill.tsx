"use client";

import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "secondary" | "info"> = {
  paid: "success",
  verified: "success",
  approved: "success",
  success: "success",
  active: "success",
  issued: "warning",
  pending: "warning",
  correction_requested: "warning",
  partially_paid: "info",
  processing: "info",
  overdue: "danger",
  rejected: "danger",
  failed: "danger",
  cancelled: "secondary",
  void: "secondary",
  inactive: "secondary",
};

export function StatusPill({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const key = status.toLowerCase();
  return (
    <Badge variant={STATUS_VARIANT[key] ?? "secondary"} className={cn("tnum", className)}>
      <span
        aria-hidden
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
      />
      {titleCase(status)}
    </Badge>
  );
}
