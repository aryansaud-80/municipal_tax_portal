"use client";

import { useState } from "react";
import { useReceipts } from "@/features/receipts/hooks";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/shared/States";
import { Pagination } from "@/components/shared/Pagination";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default function ReceiptsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useReceipts({
    page,
    limit: 10,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Receipts"
        description="Official receipts issued for verified payments."
      />

      {isLoading ? (
        <LoadingState label="Loading receipts..." />
      ) : isError ? (
        <ErrorState message="Unable to load receipts." onRetry={() => refetch()} />
      ) : !data || data.data.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState title="No receipts issued yet" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Related Payment</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-medium">
                      {receipt.receiptNumber}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {receipt.payment?.paymentNumber ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {receipt.taxAssessment?.taxCategory?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(receipt.createdAt)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(receipt.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              page={page}
              totalPages={data.meta.totalPages}
              onChange={setPage}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
