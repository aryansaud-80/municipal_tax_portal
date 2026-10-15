"use client";

import { useState } from "react";
import { ReceiptText, Wallet, Eye } from "lucide-react";
import { useMyBills, useBillFines } from "@/features/bills/hooks";
import type { Bill } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BillPayDialog } from "@/components/forms/BillPayDialog";
import { BillDetail } from "@/components/shared/BillDetail";
import { StatusPill } from "@/components/shared/StatusPill";
import { formatCurrency, formatDate } from "@/lib/format";

export default function TaxesPage() {
  const { data, isLoading, isError, refetch } = useMyBills();
  const [paying, setPaying] = useState<Bill | null>(null);
  const [viewing, setViewing] = useState<Bill | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: fines } = useBillFines(viewing?.id ?? null);

  const filtered = (data ?? []).filter((b) =>
    statusFilter === "all" ? true : b.status === statusFilter,
  );
  const outstanding = (data ?? [])
    .filter((b) => ["issued", "partially_paid", "overdue"].includes(b.status))
    .reduce((s, b) => s + (Number(b.totalPayable) - Number(b.amountPaid)), 0);

  const viewingBalance = viewing
    ? Number(viewing.totalPayable) - Number(viewing.amountPaid)
    : 0;
  const viewingPayable =
    viewing &&
    ["issued", "partially_paid", "overdue"].includes(viewing.status) &&
    viewingBalance > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Taxes & Dues"
        description={
          data && data.length > 0
            ? `Outstanding balance ${formatCurrency(outstanding)} across ${filtered.length} bill(s).`
            : "Your issued tax bills will appear here."
        }
        actions={
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(typeof v === "string" ? v : "all")}>
            <SelectTrigger className="w-44" size="sm">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="issued">Issued</SelectItem>
              <SelectItem value="partially_paid">Partially paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {isLoading ? (
        <LoadingState label="Loading your bills..." />
      ) : isError ? (
        <ErrorState message="Unable to load bills." onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title="No bills found"
              description="Once your property is verified and the municipality issues a bill, it will appear here with its due date."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((bill) => {
            const balance = Number(bill.totalPayable) - Number(bill.amountPaid);
            const payable = ["issued", "partially_paid", "overdue"].includes(bill.status) && balance > 0;
            return (
              <Card key={bill.id} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
                      <ReceiptText className="h-5 w-5" aria-hidden />
                    </div>
                    <StatusPill status={bill.status} />
                  </div>
                  <CardTitle className="mt-3 text-base">
                    {bill.taxCategory?.name ?? "Tax"}
                  </CardTitle>
                  <CardDescription className="tnum">
                    {bill.billNumber} • FY {bill.fiscalYear} • Due {formatDate(bill.dueDate)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Principal</span>
                    <span className="font-medium tnum">{formatCurrency(bill.principal)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Penalties</span>
                    <span className="tnum">{formatCurrency(bill.penalty)}</span>
                  </div>
                  <div className="flex justify-between gap-3 border-t pt-2">
                    <span className="font-medium">Balance</span>
                    <span className={balance > 0 ? "font-semibold text-primary tnum" : "font-semibold text-success tnum"}>
                      {formatCurrency(balance)}
                    </span>
                  </div>
                </CardContent>
                <CardContent className="flex gap-2 pt-0">
                  <Button variant="secondary" className="flex-1" onClick={() => setViewing(bill)}>
                    <Eye className="h-4 w-4" aria-hidden /> Details
                  </Button>
                  {payable ? (
                    <Button className="flex-1" onClick={() => setPaying(bill)}>
                      <Wallet className="h-4 w-4" aria-hidden /> Pay now
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!paying} onOpenChange={(o) => !o && setPaying(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay {paying?.billNumber}</DialogTitle>
            <DialogDescription>
              Settle this bill through the test payment provider.
            </DialogDescription>
          </DialogHeader>
          {paying ? <BillPayDialog bill={paying} onDone={() => setPaying(null)} /> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg p-0">
          <div className="p-5 pb-0">
            <DialogHeader>
              <DialogTitle>Bill {viewing?.billNumber}</DialogTitle>
              <DialogDescription>Full breakdown, penalties and balance.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-5">
            {viewing ? <BillDetail bill={viewing} fines={fines} /> : null}
          </div>
          {viewingPayable && viewing ? (
            <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-surface p-4 md:hidden">
              <div>
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className="font-semibold tnum">{formatCurrency(viewingBalance)}</p>
              </div>
              <Button
                onClick={() => {
                  setPaying(viewing);
                  setViewing(null);
                }}
              >
                <Wallet className="h-4 w-4" aria-hidden /> Pay now
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
