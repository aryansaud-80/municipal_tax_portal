"use client";

import { useState } from "react";
import { useTaxAssessments } from "@/features/taxes/hooks";
import type { TaxAssessment } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, ErrorState } from "@/components/shared/States";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable, type DataColumn } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { formatCurrency, formatDate } from "@/lib/format";

const columns: DataColumn<TaxAssessment>[] = [
  {
    key: "assessment",
    header: "Assessment",
    sortable: true,
    sortValue: (a) => a.assessmentNumber,
    render: (a) => <span className="font-medium tnum">{a.assessmentNumber}</span>,
  },
  {
    key: "category",
    header: "Category",
    render: (a) => <span>{a.taxCategory?.name ?? "—"}</span>,
  },
  {
    key: "owner",
    header: "Owner",
    render: (a) => (
      <span className="text-muted-foreground">
        {a.user ? `${a.user.firstName} ${a.user.lastName}` : "—"}
      </span>
    ),
  },
  {
    key: "fy",
    header: "FY",
    render: (a) => <span className="text-muted-foreground tnum">{a.fiscalYear}</span>,
  },
  {
    key: "due",
    header: "Total due",
    sortable: true,
    numeric: true,
    sortValue: (a) => Number(a.totalDue),
    render: (a) => <span className="font-semibold tnum">{formatCurrency(a.totalDue)}</span>,
  },
  {
    key: "paid",
    header: "Paid",
    numeric: true,
    sortValue: (a) => Number(a.amountPaid),
    render: (a) => <span className="text-muted-foreground tnum">{formatCurrency(a.amountPaid)}</span>,
  },
  {
    key: "dueDate",
    header: "Due date",
    sortable: true,
    sortValue: (a) => a.dueDate,
    render: (a) => <span className="text-muted-foreground">{formatDate(a.dueDate)}</span>,
  },
  {
    key: "status",
    header: "Status",
    render: (a) => <StatusBadge status={a.status} />,
  },
];

export default function TaxesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const [selected, setSelected] = useState<TaxAssessment | null>(null);
  const { data, isLoading, isError, refetch } = useTaxAssessments({
    page,
    limit: 10,
    status: status === "all" ? undefined : status,
  });

  if (isLoading) return <LoadingState label="Loading assessments..." />;
  if (isError || !data) {
    return <ErrorState message="Unable to load assessments." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax Assessments"
        description="All tax assessments across the municipality."
      />

      <DataTable<TaxAssessment>
        columns={[
          ...columns,
          {
            key: "actions",
            header: "Actions",
            hideable: false,
            render: (a) => (
              <span className="flex justify-end">
                <Button variant="secondary" size="sm" onClick={() => setSelected(a)}>
                  Details
                </Button>
              </span>
            ),
          },
        ]}
        rows={data.data}
        keyOf={(a) => a.id}
        loading={isLoading}
        emptyTitle="No assessments found"
        emptyDescription="Assessments appear here once staff create them from verified properties."
        filters={
          <Select value={status} onValueChange={(v) => { setStatus(typeof v === "string" ? v : "all"); setPage(1); }}>
            <SelectTrigger size="sm" className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partially_paid">Partially paid</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        }
        page={page}
        totalPages={data.meta.totalPages}
        onPageChange={setPage}
        ariaLabel="Tax assessments"
      />

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="tnum">{selected?.assessmentNumber}</SheetTitle>
            <SheetDescription>
              {selected?.taxCategory?.name} • FY {selected?.fiscalYear}
            </SheetDescription>
          </SheetHeader>
          {selected ? (
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Taxpayer</dt>
                <dd className="font-medium">
                  {selected.user ? `${selected.user.firstName} ${selected.user.lastName}` : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Property</dt>
                <dd className="font-medium tnum">{selected.property?.propertyNumber ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Assessed value</dt>
                <dd className="tnum">{formatCurrency(selected.assessedValue)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Tax amount</dt>
                <dd className="tnum">{formatCurrency(selected.taxAmount)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Discount / Penalty</dt>
                <dd className="tnum">
                  {formatCurrency(selected.discount)} / {formatCurrency(selected.penalty)}
                </dd>
              </div>
              <div className="flex justify-between gap-3 border-t pt-2">
                <dt className="font-medium">Total due</dt>
                <dd className="font-semibold tnum">{formatCurrency(selected.totalDue)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Paid</dt>
                <dd className="tnum">{formatCurrency(selected.amountPaid)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Status</dt>
                <dd><StatusBadge status={selected.status} /></dd>
              </div>
              {selected.notes ? (
                <p className="rounded-[10px] bg-muted p-3 text-muted-foreground">{selected.notes}</p>
              ) : null}
            </dl>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
