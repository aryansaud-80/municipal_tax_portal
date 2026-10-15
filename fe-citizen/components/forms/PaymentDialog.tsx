"use client";

import { useState } from "react";
import { useCreatePayment } from "@/features/payments/hooks";
import { TaxAssessment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";

export function PaymentDialog({
  assessment,
  onDone,
}: {
  assessment: TaxAssessment;
  onDone: () => void;
}) {
  const create = useCreatePayment();
  const remaining = assessment.totalDue - assessment.amountPaid;
  const [amount, setAmount] = useState<string>(String(remaining));
  const [method, setMethod] = useState<string>("khalti");

  const submit = () => {
    create.mutate(
      {
        taxAssessmentId: assessment.id,
        amount: Number(amount),
        method,
      },
      {
        onSuccess: () => onDone(),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-muted p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Assessment</span>
          <span className="font-medium">
            {assessment.assessmentNumber}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Category</span>
          <span className="font-medium">
            {assessment.taxCategory?.name ?? "Tax"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total due</span>
          <span className="font-semibold">
            {formatCurrency(assessment.totalDue)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Already paid</span>
          <span>{formatCurrency(assessment.amountPaid)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t pt-1">
          <span className="font-medium">Remaining</span>
          <span className="font-semibold text-primary">
            {formatCurrency(remaining)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount (NPR)</Label>
        <Input
          id="amount"
          type="number"
          step="any"
          min={1}
          max={remaining}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Payment method</Label>
        <Select value={method} onValueChange={(v) => v && setMethod(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Choose method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="khalti">Khalti</SelectItem>
            <SelectItem value="esewa">eSewa</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {create.isError ? (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {create.error instanceof Error
            ? create.error.message
            : "Payment failed. Please try again."}
        </div>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button
          onClick={submit}
          disabled={create.isPending || !Number(amount) || Number(amount) > remaining}
        >
          {create.isPending ? "Processing..." : "Proceed to payment"}
        </Button>
      </div>
    </div>
  );
}
