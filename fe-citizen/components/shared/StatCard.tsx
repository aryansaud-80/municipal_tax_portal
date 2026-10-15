"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Sparkline } from "@/components/shared/TrendChart";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  spark,
  className,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  trend?: { value: string; direction: "up" | "down" | "flat" };
  spark?: number[];
  className?: string;
}) {
  const TrendIcon =
    !trend || trend.direction === "flat"
      ? Minus
      : trend.direction === "up"
        ? TrendingUp
        : TrendingDown;
  return (
    <Card className={className}>
      <CardContent>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
            <Icon className="h-[18px] w-[18px]" aria-hidden />
          </div>
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight tnum">{value}</p>
        <div className="mt-1.5 flex min-h-5 flex-wrap items-center gap-2">
          {trend ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tnum",
                trend.direction === "up" && "bg-success/10 text-success dark:bg-success/15",
                trend.direction === "down" && "bg-danger/10 text-danger dark:bg-danger/15",
                trend.direction === "flat" && "bg-muted text-muted-foreground",
              )}
            >
              <TrendIcon className="h-3 w-3" aria-hidden />
              {trend.value}
            </span>
          ) : null}
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {spark && spark.length > 1 ? (
          <div className="mt-2">
            <Sparkline data={spark} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
