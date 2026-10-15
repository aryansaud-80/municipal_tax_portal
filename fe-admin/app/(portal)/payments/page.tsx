"use client";

import { useState } from "react";
import { usePayments, useVerifyPayment } from "@/features/payments/hooks";
import type { Payment } from "@/lib/types";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatCurrency, formatDateTime, titleCase } from "@/lib/format";

const columns: DataColumn<Payment>[] = [
  {
    key: "payment",
    header: "Payment",
    sortable: true,
    sortValue: (p) => p.paymentNumber,
    render: (p) => <span className="font-medium tnum">{p.paymentNumber}</span>,
  },
  {
    key: "payer",
    header: "Payer",
    render: (p) => (
      <span className="text-muted-foreground">
        {p.user ? `${p.user.firstName} ${p.user.lastName}` : "—"}
      </span>
    ),
  },
  {
    key: "method",
    header: "Method",
    render: (p) => <span className="text-muted-foreground">{titleCase(p.method)}</span>,
  },
  {
    key: "date",
    header: "Date",
    sortable: true,
    sortValue: (p) => p.createdAt,
    render: (p) => <span className="text-muted-foreground">{formatDateTime(p.createdAt)}</span>,
  },
  {
    key: "amount",
    header: "Amount",
    sortable: true,
    numeric: true,
    sortValue: (p) => Number(p.amount),
    render: (p) => <span className="font-semibold tnum">{formatCurrency(p.amount)}</span>,
  },
  {
    key: "status",
    header: "Status",
    render: (p) => <StatusBadge status={p.status} />,
  },
];

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const [selected, setSelected] = useState<Payment | null>(null);
  const [confirming, setConfirming] = useState<Payment | null>(null);
  const verify = useVerifyPayment();

  const { data, isLoading, isError, refetch } = usePayments({
    page,
    limit: 10,
    status: status === "all" ? undefined : status,
  });

  if (isLoading) return <LoadingState label="Loading payments..." />;
  if (isError || !data) {
    return <ErrorState message="Unable to load payments." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Review and verify citizen tax payments."
      />

      <DataTable<Payment>
        columns={[
          ...columns,
          {
            key: "actions",
            header: "Actions",
            hideable: false,
            render: (p) => (
              <span className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setSelected(p)}>
                  Details
                </Button>
                {p.status === "pending" ? (
                  <Button size="sm" disabled={verify.isPending} onClick={() => setConfirming(p)}>
                    Verify
                  </Button>
                ) : null}
              </span>
            ),
          },
        ]}
        rows={data.data}
        keyOf={(p) => p.id}
        loading={isLoading}
        emptyTitle="No payments found"
        emptyDescription="Counter and online payments will appear here for verification."
        filters={
          <Select value={status} onValueChange={(v) => { setStatus(typeof v === "string" ? v : "all"); setPage(1); }}>
            <SelectTrigger size="sm" className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        }
        page={page}
        totalPages={data.meta.totalPages}
        onPageChange={setPage}
        ariaLabel="Payments"
      />

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="tnum">{selected?.paymentNumber}</SheetTitle>
            <SheetDescription>Payment transaction detail.</SheetDescription>
          </SheetHeader>
          {selected ? (
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Payer</dt>
                <dd className="font-medium">
                  {selected.user ? `${selected.user.firstName} ${selected.user.lastName}` : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Amount</dt>
                <dd className="font-semibold tnum">{formatCurrency(selected.amount)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Method</dt>
                <dd>{titleCase(selected.method)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Status</dt>
                <dd><StatusBadge status={selected.status} /></dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Paid at</dt>
                <dd>{selected.paidAt ? formatDateTime(selected.paidAt) : "—"}</dd>
              </div>
              {selected.failureReason ? (
                <div className="rounded-[10px] bg-danger/10 p-3 text-danger">
                  {selected.failureReason}
                </div>
              ) : null}
              {selected.status === "pending" ? (
                <div className="pt-2">
                  <Button disabled={verify.isPending} onClick={() => setConfirming(selected)}>
                    Verify payment
                  </Button>
                </div>
              ) : null}
            </dl>
          ) : null}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!confirming}
        onOpenChange={(o) => !o && setConfirming(null)}
        title="Verify payment"
        description={`Confirm receipt of ${confirming ? formatCurrency(confirming.amount) : ""} (${confirming?.paymentNumber ?? ""}). This records the payment as verified and cannot be undone.`}
        confirmLabel="Confirm verify"
        loading={verify.isPending}
        onConfirm={() => {
          if (!confirming) return;
          verify.mutate(confirming.id, { onSuccess: () => setConfirming(null) });
        }}
      />
    </div>
  );
}
