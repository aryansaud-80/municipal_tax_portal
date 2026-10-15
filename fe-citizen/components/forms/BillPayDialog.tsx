"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, Landmark, Building2 } from "lucide-react";
import { useInitiatePayment, useConfirmMockPayment } from "@/features/bills/hooks";
import type { Bill } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/shared/StatusPill";
import { formatCurrency, formatDate } from "@/lib/format";
import { getAuthErrorMessage } from "@/features/auth/hooks";
import { cn } from "@/lib/utils";

const STEPS = ["Review", "Method", "Confirm"] as const;

function Stepper({ step }: { step: number }) {
  return (
    <ol aria-label="Payment progress" className="flex items-center gap-1">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const current = n === step;
        return (
          <li key={label} className="flex flex-1 items-center gap-1 last:flex-none">
            <div className="flex flex-1 flex-col items-center gap-1">
              <span
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold tnum transition-colors duration-150",
                  done && "bg-success text-white",
                  current && "bg-primary text-primary-foreground",
                  !done && !current && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden /> : n}
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium",
                  current ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {n < STEPS.length ? (
              <div aria-hidden className={cn("mb-5 h-px flex-1", n < step ? "bg-success" : "bg-border")} />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export function BillPayDialog({ bill, onDone }: { bill: Bill; onDone: () => void }) {
  const router = useRouter();
  const initiate = useInitiatePayment();
  const confirm = useConfirmMockPayment();
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<"mock" | "office">("mock");
  const [providerRef, setProviderRef] = useState<string | null>(null);
  const [paidAmount, setPaidAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const balance = Number(bill.totalPayable) - Number(bill.amountPaid);

  const startConfirm = () => {
    setError(null);
    initiate.mutate(bill.id, {
      onSuccess: (res) => {
        setProviderRef(res.checkout.providerRef);
        confirm.mutate(res.checkout.providerRef, {
          onSuccess: () => {
            setPaidAmount(res.checkout.amount);
            setStep(4);
          },
          onError: (e) => setError(getAuthErrorMessage(e)),
        });
      },
      onError: (e) => setError(getAuthErrorMessage(e)),
    });
  };

  const busy = initiate.isPending || confirm.isPending;

  if (step === 4) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </div>
        <div>
          <p className="text-lg font-semibold">Payment successful</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {paidAmount != null ? formatCurrency(paidAmount) : ""} received for {bill.billNumber}.
            {providerRef ? (
              <>
                {" "}Reference <span className="font-mono tnum">{providerRef}</span>.
              </>
            ) : null}{" "}
            A receipt has been issued.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            variant="secondary"
            onClick={() => {
              onDone();
              router.push("/receipts");
            }}
          >
            Download receipt
          </Button>
          <Button onClick={onDone}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Stepper step={step} />

      {step === 1 ? (
        <div className="space-y-3">
          <dl className="space-y-2 rounded-[10px] border p-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Bill</dt>
              <dd className="font-medium tnum">{bill.billNumber}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Category</dt>
              <dd className="font-medium">{bill.taxCategory?.name ?? "Tax"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Period</dt>
              <dd className="font-medium tnum">
                FY {bill.fiscalYear} · {bill.periodLabel}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Due date</dt>
              <dd className="font-medium">{formatDate(bill.dueDate)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t pt-2">
              <dt className="font-medium">Amount due</dt>
              <dd className="font-semibold text-primary tnum">{formatCurrency(balance)}</dd>
            </div>
          </dl>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onDone}>
              Cancel
            </Button>
            <Button onClick={() => setStep(2)}>Continue</Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          <button
            onClick={() => setMethod("mock")}
            aria-pressed={method === "mock"}
            className={cn(
              "flex w-full items-center gap-3 rounded-[10px] border p-4 text-left transition-colors duration-150",
              method === "mock" ? "border-primary bg-primary-soft/50" : "hover:border-muted-foreground/40",
            )}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
              <Landmark className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-medium">eSewa test checkout</span>
              <span className="block text-xs text-muted-foreground">
                Development provider — no real money moves.
              </span>
            </span>
          </button>
          <button
            onClick={() => setMethod("office")}
            aria-pressed={method === "office"}
            className={cn(
              "flex w-full items-center gap-3 rounded-[10px] border p-4 text-left transition-colors duration-150",
              method === "office" ? "border-primary bg-primary-soft/50" : "hover:border-muted-foreground/40",
            )}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
              <Building2 className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-medium">Pay at municipal office</span>
              <span className="block text-xs text-muted-foreground">
                Cash counter, Sun–Fri 10am–5pm. No online step needed.
              </span>
            </span>
          </button>
          <div className="flex justify-between gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)}>Continue</Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3">
          {method === "office" ? (
            <div className="rounded-[10px] border p-4 text-sm">
              <p className="font-medium">Pay in person</p>
              <p className="mt-1 text-muted-foreground">
                Visit the revenue counter with bill <span className="font-mono tnum">{bill.billNumber}</span> and
                pay <strong className="text-foreground tnum">{formatCurrency(balance)}</strong> in cash.
                The cashier records it and issues your receipt on the spot.
              </p>
            </div>
          ) : (
            <div className="rounded-[10px] border border-dashed p-4 text-sm">
              <p className="font-medium">Confirm test payment</p>
              <p className="mt-1 text-muted-foreground">
                Pay <strong className="text-foreground tnum">{formatCurrency(balance)}</strong> via the
                simulated provider. Only the provider&apos;s server confirmation settles this payment.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <StatusPill status={bill.status} />
              </div>
            </div>
          )}
          {error ? (
            <div role="alert" className="rounded-[10px] bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          ) : null}
          <div className="flex justify-between gap-2">
            <Button variant="secondary" onClick={() => setStep(2)} disabled={busy}>
              Back
            </Button>
            {method === "office" ? (
              <Button onClick={onDone}>Got it</Button>
            ) : (
              <Button onClick={startConfirm} loading={busy}>
                {busy ? "Confirming…" : `Pay ${formatCurrency(balance)}`}
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
