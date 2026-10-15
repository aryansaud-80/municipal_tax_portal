"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { getReport, downloadCsv } from "@/features/reports/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";

type Row = Record<string, unknown>;

export default function ReportsPage() {
  const [fiscalYear, setFiscalYear] = useState("2082/83");
  const [error, setError] = useState<string | null>(null);

  const byCategory = useQuery({
    queryKey: ["reports", "by-category", fiscalYear],
    queryFn: () => getReport<Row[]>("revenue-by-category", { fiscalYear }),
  });
  const byPeriod = useQuery({
    queryKey: ["reports", "by-period", fiscalYear],
    queryFn: () => getReport<Row[]>("revenue-by-period", { fiscalYear }),
  });
  const overdue = useQuery({
    queryKey: ["reports", "overdue"],
    queryFn: () =>
      getReport<{ bills: Row[]; fineTotal: number; fineCount: number }>("overdue"),
  });
  const collections = useQuery({
    queryKey: ["reports", "collections"],
    queryFn: () =>
      getReport<{ byMethod: Row[]; total: number }>("collections"),
  });
  const verification = useQuery({
    queryKey: ["reports", "verification"],
    queryFn: () => getReport<Row>("verification"),
  });

  const loading = byCategory.isLoading || byPeriod.isLoading;
  const failed = byCategory.isError || byPeriod.isError;

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Persisted-data revenue, outstanding, overdue and verification reports with CSV export."
        actions={
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="fy">Fiscal year</Label>
              <Input
                id="fy"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="w-32"
              />
            </div>
          </div>
        }
      />

      {error ? (
        <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      ) : null}

      {loading ? (
        <LoadingState label="Loading reports..." />
      ) : failed ? (
        <ErrorState
          message="Unable to load reports."
          onRetry={() => {
            byCategory.refetch();
            byPeriod.refetch();
          }}
        />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Revenue by Category ({fiscalYear})</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  try {
                    downloadCsv(`revenue-by-category-${fiscalYear}.csv`, (byCategory.data ?? []) as Row[]);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Export failed");
                  }
                }}
              >
                <Download className="mr-1 h-3 w-3" /> CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {!byCategory.data || byCategory.data.length === 0 ? (
                <CardContent><EmptyState title="No category data" /></CardContent>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Billed</TableHead>
                      <TableHead className="text-right">Collected</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead className="text-right">Penalties</TableHead>
                      <TableHead className="text-right">Bills</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byCategory.data.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{String(r.categoryName)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(r.billed))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(r.collected))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(r.outstanding))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(r.penalties))}</TableCell>
                        <TableCell className="text-right">{String(r.billCount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Collections by Method</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadCsv("collections-by-method.csv", (collections.data?.byMethod ?? []) as Row[])}
                >
                  <Download className="mr-1 h-3 w-3" /> CSV
                </Button>
              </CardHeader>
              <CardContent>
                {!collections.data ? (
                  <EmptyState title="No collections yet" />
                ) : (
                  <div className="space-y-2 text-sm">
                    {(collections.data.byMethod ?? []).map((m, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="font-medium">{String(m.method)}</span>
                        <span>{formatCurrency(Number(m.total))} ({String(m.count)} payments)</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span>Total verified</span>
                      <span>{formatCurrency(collections.data.total)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Overdue & Penalties</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadCsv("overdue-bills.csv", (overdue.data?.bills ?? []) as Row[])}
                >
                  <Download className="mr-1 h-3 w-3" /> CSV
                </Button>
              </CardHeader>
              <CardContent>
                {!overdue.data ? (
                  <EmptyState title="No overdue data" />
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Overdue bills</span><span className="font-semibold">{overdue.data.bills.length}</span></div>
                    <div className="flex justify-between"><span>Recorded fines</span><span>{overdue.data.fineCount} • {formatCurrency(overdue.data.fineTotal)}</span></div>
                    {overdue.data.bills.slice(0, 8).map((b, i) => (
                      <div key={i} className="flex justify-between text-xs text-muted-foreground">
                        <span>{String((b as Row).billNumber)}</span>
                        <span>{formatCurrency(Number((b as Row).totalPayable) - Number((b as Row).amountPaid))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Verification Queue</CardTitle></CardHeader>
            <CardContent>
              {!verification.data ? (
                <EmptyState title="No verification data" />
              ) : (
                <div className="grid gap-2 text-sm sm:grid-cols-4">
                  <div><p className="text-muted-foreground">Pending</p><p className="text-xl font-bold">{String(verification.data.pending ?? 0)}</p></div>
                  <div><p className="text-muted-foreground">Corrections</p><p className="text-xl font-bold">{String(verification.data.correctionRequested ?? 0)}</p></div>
                  <div><p className="text-muted-foreground">Approved</p><p className="text-xl font-bold">{String(verification.data.approved ?? 0)}</p></div>
                  <div><p className="text-muted-foreground">Rejected</p><p className="text-xl font-bold">{String(verification.data.rejected ?? 0)}</p></div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Revenue by Period</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCsv(`revenue-by-period-${fiscalYear}.csv`, (byPeriod.data ?? []) as Row[])}
              >
                <Download className="mr-1 h-3 w-3" /> CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {!byPeriod.data || byPeriod.data.length === 0 ? (
                <CardContent><EmptyState title="No period data" /></CardContent>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fiscal year</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Billed</TableHead>
                      <TableHead className="text-right">Collected</TableHead>
                      <TableHead className="text-right">Bills</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byPeriod.data.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{String(r.fiscalYear)}</TableCell>
                        <TableCell className="font-medium">{String(r.period)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(r.billed))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(r.collected))}</TableCell>
                        <TableCell className="text-right">{String(r.billCount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
