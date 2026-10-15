"use client";

import { useState } from "react";
import { useMyPayments } from "@/features/payments/hooks";
import { useMyAssessments } from "@/features/taxes/hooks";
import type { Payment, TaxAssessment } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentDialog } from "@/components/forms/PaymentDialog";
import { StatusPill } from "@/components/shared/StatusPill";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default function PaymentsPage() {
  const { data, isLoading, isError, refetch } = useMyPayments();
  const assessments = useMyAssessments();
  const [paying, setPaying] = useState<TaxAssessment | null>(null);

  const payableAssessments =
    assessments.data?.filter(
      (a) => a.status !== "paid" && a.totalDue - a.amountPaid > 0,
    ) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Track your tax payments and make new ones."
        actions={
          payableAssessments.length ? (
            <Button onClick={() => setPaying(payableAssessments[0])}>
              Make a payment
            </Button>
          ) : null
        }
      />

      {isLoading ? (
        <LoadingState label="Loading payments..." />
      ) : isError ? (
        <ErrorState message="Unable to load payments." onRetry={() => refetch()} />
      ) : !data || data.data.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title="No payments yet"
              description="Payments you make for your property taxes will appear here."
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <CardContent className="p-0">
            <Table aria-label="Payment history">
              <TableHeader>
                <TableRow>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((payment: Payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium tnum">
                      {payment.paymentNumber}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(payment.createdAt)}
                    </TableCell>
                    <TableCell>
                      {payment.taxAssessment?.taxCategory?.name ?? "Tax"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tnum">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusPill status={payment.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!paying} onOpenChange={(o) => !o && setPaying(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make a payment</DialogTitle>
            <DialogDescription>
              Choose the amount and payment method to settle your tax.
            </DialogDescription>
          </DialogHeader>
          {paying ? (
            <PaymentDialog assessment={paying} onDone={() => setPaying(null)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
