"use client";

import { useState } from "react";
import { useMyReceipts } from "@/features/receipts/hooks";
import { Receipt } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/shared/States";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ReceiptDetail } from "@/components/shared/ReceiptDetail";

export default function ReceiptsPage() {
  const { data, isLoading, isError, refetch } = useMyReceipts();
  const [selected, setSelected] = useState<Receipt | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Receipts"
        description="Official receipts for your confirmed tax payments."
      />

      {isLoading ? (
        <LoadingState label="Loading receipts..." />
      ) : isError ? (
        <ErrorState message="Unable to load receipts." onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title="No receipts yet"
              description="Once a payment is verified, an official receipt will be issued here."
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <CardContent className="p-0">
            <Table aria-label="Receipt history">
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((receipt: Receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-medium tnum">
                      {receipt.receiptNumber}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(receipt.createdAt)}
                    </TableCell>
                    <TableCell>
                      {receipt.taxAssessment?.taxCategory?.name ?? "Tax"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tnum">
                      {formatCurrency(receipt.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelected(receipt)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tax Payment Receipt</DialogTitle>
          </DialogHeader>
          {selected ? <ReceiptDetail receipt={selected} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
