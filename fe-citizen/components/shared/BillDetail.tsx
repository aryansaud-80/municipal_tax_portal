"use client";

import type { Bill, Fine } from "@/lib/types";
import { formatCurrency, formatDate, titleCase } from "@/lib/format";
import { StatusPill } from "@/components/shared/StatusPill";

export function BillDetail({ bill, fines }: { bill: Bill; fines?: Fine[] }) {
  const balance = Number(bill.totalPayable) - Number(bill.amountPaid);
  const b = bill.calculationBreakdown;
  return (
    <div className="print-block space-y-4 rounded-[14px] border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Municipal Tax Bill
          </p>
          <p className="text-lg font-semibold tnum">{bill.billNumber}</p>
          <p className="text-xs text-muted-foreground">
            {bill.taxCategory?.name} • FY {bill.fiscalYear} • {titleCase(bill.periodLabel)}
          </p>
        </div>
        <StatusPill status={bill.status} />
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-xs text-muted-foreground">Issue date</dt><dd className="font-medium">{formatDate(bill.issueDate)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Due date (BS)</dt><dd className="font-medium">{formatDate(bill.dueDate)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Property</dt><dd className="font-medium tnum">{bill.property?.propertyNumber ?? "—"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Rule</dt><dd className="font-medium">{b?.ruleName ?? "Municipal rule"}</dd></div>
      </dl>

      <div className="space-y-1.5 border-t pt-3 text-sm">
        <div className="flex justify-between gap-3"><span className="text-muted-foreground">Principal</span><span className="font-medium tnum">{formatCurrency(bill.principal)}</span></div>
        {b?.slabDetails?.map((s, i) => (
          <div key={i} className="flex justify-between gap-3 pl-4 text-xs"><span className="text-muted-foreground">{s.label}</span><span className="tnum">{formatCurrency(s.amount)}</span></div>
        ))}
        <div className="flex justify-between gap-3"><span className="text-muted-foreground">Discount</span><span className="tnum">− {formatCurrency(bill.discount)}</span></div>
        <div className="flex justify-between gap-3"><span className="text-muted-foreground">Penalties</span><span className="tnum">{formatCurrency(bill.penalty)}</span></div>
        {fines?.map((f) => (
          <div key={f.id} className="flex justify-between gap-3 pl-4 text-xs">
            <span className="text-muted-foreground tnum">{f.fineNumber} ({f.percent}% of {titleCase(f.penaltyBase)})</span>
            <span className="tnum">{f.waived ? "waived" : formatCurrency(f.amount)}</span>
          </div>
        ))}
        <div className="flex justify-between gap-3 border-t pt-2 font-semibold"><span>Total payable</span><span className="tnum">{formatCurrency(bill.totalPayable)}</span></div>
        <div className="flex justify-between gap-3"><span className="text-muted-foreground">Paid</span><span className="tnum">{formatCurrency(bill.amountPaid)}</span></div>
        <div className="flex justify-between gap-3 font-semibold"><span>Balance</span><span className={balance > 0 ? "text-primary tnum" : "text-success tnum"}>{formatCurrency(balance)}</span></div>
      </div>

      <div className="no-print flex justify-end">
        <button
          onClick={() => window.print()}
          className="rounded-[10px] border px-3 py-2 text-sm font-medium transition-colors duration-150 hover:border-primary/40 hover:text-primary"
        >
          Print bill
        </button>
      </div>
    </div>
  );
}
