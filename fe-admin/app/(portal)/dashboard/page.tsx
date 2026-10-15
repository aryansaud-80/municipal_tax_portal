"use client";

import { useRouter } from "next/navigation";
import {
  Wallet,
  AlertTriangle,
  Users,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useAdminDashboard } from "@/features/dashboard/hooks";
import { useMe } from "@/features/auth/hooks";
import { StatCard } from "@/components/shared/StatCard";
import { TrendChart } from "@/components/shared/TrendChart";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getReport } from "@/features/reports/api";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/format";

export default function DashboardPage() {
  const router = useRouter();
  const { data: user } = useMe();
  const { data, isLoading, isError, refetch } = useAdminDashboard();
  const canReport = user?.permissions?.includes("report.view") ?? false;
  const trend = useQuery({
    queryKey: ["dashboard", "trend"],
    queryFn: () =>
      getReport<Array<{ period: string; collected: string }>>("revenue-by-period"),
    enabled: canReport,
  });
  const overdue = useQuery({
    queryKey: ["dashboard", "overdue"],
    queryFn: () =>
      getReport<{ bills: Array<{ id: string; billNumber: string; totalPayable: string; amountPaid: string; dueDate: string }>; fineTotal: number; fineCount: number }>("overdue"),
    enabled: canReport,
  });

  if (isLoading) return <LoadingState label="Loading admin dashboard..." />;
  if (isError || !data) {
    return (
      <ErrorState message="Unable to load dashboard." onRetry={() => refetch()} />
    );
  }

  const trendData = (trend.data ?? []).slice(-8).map((r) => ({
    label: String(r.period),
    value: Number(r.collected),
  }));
  const overdueBills = (overdue.data?.bills ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? "Admin"}`}
        description="Municipal tax administration overview."
        actions={
          <Button onClick={() => router.push("/bills")}>
            Issue bill <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        }
      />

      <section aria-label="Key performance indicators" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total collected"
          value={formatCurrency(data.totalRevenue)}
          icon={Wallet}
          hint="Verified collections"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(data.billsOutstanding ?? data.outstandingTax)}
          icon={Clock}
          hint={`${data.billsIssued ?? data.totalAssessments} bills issued`}
        />
        <StatCard
          label="Overdue"
          value={data.billsOverdue ?? 0}
          icon={AlertTriangle}
          hint={`${formatCurrency(data.finesRecorded ?? 0)} fines recorded`}
        />
        <StatCard
          label="Registered taxpayers"
          value={data.totalTaxpayers}
          icon={Users}
          hint={`${data.totalProperties} properties`}
        />
      </section>

      {canReport ? (
      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Collection trend</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push("/reports")}>
              Full reports
            </Button>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <EmptyState title="No trend data yet" />
            ) : (
              <TrendChart data={trendData} />
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-[18px] w-[18px] text-warning" aria-hidden />
              Overdue alerts
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push("/bills")}>
              Review
            </Button>
          </CardHeader>
          <CardContent>
            {overdueBills.length === 0 ? (
              <EmptyState title="No overdue bills" description="Everything is on schedule." />
            ) : (
              <ul className="space-y-2">
                {overdueBills.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-3 rounded-[10px] border border-warning/30 bg-warning/5 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium tnum">{b.billNumber}</p>
                      <p className="text-xs text-muted-foreground">Due {formatDate(b.dueDate)}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tnum">
                      {formatCurrency(Number(b.totalPayable) - Number(b.amountPaid))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent transactions</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => router.push("/payments")}>
            View all
          </Button>
        </CardHeader>
        <CardContent>
          {data.recentPayments.length === 0 ? (
            <EmptyState title="No recent payments" />
          ) : (
            <ul className="divide-y divide-border">
              {data.recentPayments.slice(0, 7).map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium tnum">{payment.paymentNumber}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {payment.user
                        ? `${payment.user.firstName} ${payment.user.lastName}`
                        : "Citizen"}{" "}
                      • {formatDate(payment.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold tnum">{formatCurrency(payment.amount)}</span>
                    <StatusBadge status={payment.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
