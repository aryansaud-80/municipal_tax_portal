"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Columns3, ChevronLeft, ChevronRight, Filter } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/States";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface DataColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  numeric?: boolean;
  hideable?: boolean;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
}

interface DataTableProps<T> {
  columns: DataColumn<T>[];
  rows: T[];
  keyOf: (row: T, index: number) => string;
  loading?: boolean;
  skeletonRows?: number;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  filters?: React.ReactNode;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  selectable?: {
    selected: (string | number)[];
    onToggle: (key: string | number) => void;
    onToggleAll: (keys: (string | number)[]) => void;
    bulkActions: { label: string; onRun: (keys: (string | number)[]) => void }[];
  };
  rowKey?: (row: T) => string | number;
  ariaLabel?: string;
}

export function DataTable<T>({
  columns,
  rows,
  keyOf,
  loading,
  skeletonRows = 5,
  emptyTitle,
  emptyDescription,
  emptyAction,
  filters,
  page,
  totalPages,
  onPageChange,
  selectable,
  rowKey,
  ariaLabel = "Data table",
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);

  const visible = useMemo(
    () => columns.filter((c) => !hidden.has(c.key)),
    [columns, hidden],
  );

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return rows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, sortKey, sortDir, columns]);

  const toggleSort = (col: DataColumn<T>) => {
    if (!col.sortable) return;
    if (sortKey !== col.key) {
      setSortKey(col.key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
    }
  };

  const allKeys = useMemo(
    () => (rowKey ? sorted.map((r) => rowKey(r)) : []),
    [sorted, rowKey],
  );
  const allSelected =
    selectable && allKeys.length > 0 && allKeys.every((k) => selectable.selected.includes(k));

  const bulkBar =
    selectable && selectable.selected.length > 0 ? (
      <div className="flex flex-wrap items-center gap-2 rounded-[10px] border bg-primary-soft px-3 py-2 text-sm">
        <span className="font-medium tnum">{selectable.selected.length} selected</span>
        {selectable.bulkActions.map((a) => (
          <Button key={a.label} size="sm" variant="secondary" onClick={() => a.onRun(selectable.selected)}>
            {a.label}
          </Button>
        ))}
      </div>
    ) : null;

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="hidden flex-1 flex-wrap items-center gap-2 md:flex">{filters}</div>
      {filters ? (
        <Button variant="secondary" size="sm" className="md:hidden" onClick={() => setFilterOpen(true)}>
          <Filter className="h-4 w-4" aria-hidden /> Filters
        </Button>
      ) : null}
      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Toggle columns"
            className="flex h-8 items-center gap-1.5 rounded-[10px] border bg-surface px-2.5 text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            <Columns3 className="h-4 w-4" aria-hidden /> Columns
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {columns
              .filter((c) => c.hideable !== false)
              .map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.key}
                  checked={!hidden.has(c.key)}
                  onCheckedChange={(checked) =>
                    setHidden((prev) => {
                      const next = new Set(prev);
                      if (checked) next.delete(c.key);
                      else next.add(c.key);
                      return next;
                    })
                  }
                >
                  {c.header}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {(filters || true) && toolbar}
      {bulkBar}

      {/* Desktop / tablet table */}
      <div className="hidden overflow-hidden rounded-[14px] border bg-surface md:block">
        <div className="overflow-x-auto">
          <Table aria-label={ariaLabel} className="min-w-full">
            <TableHeader className="sticky top-0 z-10 bg-surface">
              <TableRow className="hover:bg-transparent">
                {selectable ? (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={() => selectable.onToggleAll(allSelected ? [] : allKeys)}
                      aria-label="Select all rows"
                    />
                  </TableHead>
                ) : null}
                {visible.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      "text-xs font-medium text-muted-foreground",
                      col.numeric && "text-right tnum",
                    )}
                  >
                    {col.sortable ? (
                      <button
                        onClick={() => toggleSort(col)}
                        aria-label={`Sort by ${col.header}`}
                        className="inline-flex items-center gap-1 transition-colors duration-150 hover:text-foreground"
                      >
                        {col.header}
                        {sortKey !== col.key ? (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden />
                        ) : sortDir === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: skeletonRows }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    {(selectable ? [null, ...visible] : visible).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full max-w-32" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sorted.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={visible.length + (selectable ? 1 : 0)}>
                    <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((row, i) => {
                  const k = rowKey ? rowKey(row) : keyOf(row, i);
                  return (
                    <TableRow key={keyOf(row, i)}>
                      {selectable ? (
                        <TableCell>
                          <Checkbox
                            checked={selectable.selected.includes(k)}
                            onCheckedChange={() => selectable.onToggle(k)}
                            aria-label="Select row"
                          />
                        </TableCell>
                      ) : null}
                      {visible.map((col) => (
                        <TableCell key={col.key} className={cn(col.numeric && "text-right tnum")}>
                          {col.render(row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile stacked cards */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[14px] border bg-surface p-4">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-2 h-4 w-1/2" />
              <Skeleton className="mt-2 h-4 w-1/3" />
            </div>
          ))
        ) : sorted.length === 0 ? (
          <div className="rounded-[14px] border bg-surface">
            <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
          </div>
        ) : (
          sorted.map((row, i) => (
            <article key={keyOf(row, i)} className="rounded-[14px] border bg-surface p-4">
              <dl className="space-y-2 text-sm">
                {visible.map((col) => (
                  <div key={col.key} className="flex items-start justify-between gap-3">
                    <dt className="shrink-0 text-xs font-medium text-muted-foreground">{col.header}</dt>
                    <dd className={cn("min-w-0 text-right", col.numeric && "tnum")}>
                      {col.render(row)}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          ))
        )}
      </div>

      {page != null && totalPages != null && totalPages > 1 && onPageChange ? (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground tnum">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden /> Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
            >
              Next <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      ) : null}

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3">{filters}</div>
          <Button onClick={() => setFilterOpen(false)}>Show results</Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
