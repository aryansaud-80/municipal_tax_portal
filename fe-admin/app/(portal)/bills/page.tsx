"use client";

import { useState } from "react";
import { Plus, Layers, Eye } from "lucide-react";
import {
  useBills,
  useIssueBill,
  useBulkIssue,
  useAmendBill,
  useCancelBill,
  useMarkOverdue,
  useApplyFine,
  useBillFines,
  useWaiveFine,
  useRecordOfficePayment,
} from "@/features/bills/hooks";
import { useTaxRules } from "@/features/tax-rules/hooks";
import { getAuthErrorMessage } from "@/features/auth/hooks";
import { Bill } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { formatCurrency, formatDate } from "@/lib/format";

const inputHints: Record<string, Array<{ key: string; label: string }>> = {
  property_tax: [{ key: "assessedValue", label: "Assessed value (NPR)" }],
  house_rent_tax: [
    { key: "monthlyRent", label: "Monthly rent (NPR)" },
    { key: "months", label: "Months" },
  ],
  business_tax: [{ key: "businessCategory", label: "Business category" }],
  land_tax: [{ key: "landAreaSqM", label: "Land area (sq.m)" }],
  advertisement_tax: [
    { key: "adSizeSqFt", label: "Size (sq.ft)" },
    { key: "adQuantity", label: "Quantity" },
    { key: "adMonths", label: "Months" },
  ],
};

export default function BillsPage() {
  const [status, setStatus] = useState<string>("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const { data, isLoading, isError, refetch } = useBills({
    status: status === "all" ? undefined : status,
    overdueOnly: overdueOnly || undefined,
  });
  const { data: rules } = useTaxRules();
  const [issueOpen, setIssueOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [selected, setSelected] = useState<Bill | null>(null);
  const { data: billFines, refetch: refetchFines } = useBillFines(selected?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<{ issued: number; skipped: number; skippedRows: Array<{ subject: string; reason: string }> } | null>(null);

  const issue = useIssueBill();
  const bulk = useBulkIssue();
  const amend = useAmendBill();
  const cancel = useCancelBill();
  const markOd = useMarkOverdue();
  const applyFine = useApplyFine();
  const waiveFine = useWaiveFine();
  const officePay = useRecordOfficePayment();

  const [form, setForm] = useState({ taxCategoryId: "", fiscalYear: "2082/83", propertyId: "", userId: "", discount: "" });
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [bulkForm, setBulkForm] = useState({ taxCategoryId: "", fiscalYear: "2082/83", ward: "" });
  const [amendReason, setAmendReason] = useState("");
  const [amendAdj, setAmendAdj] = useState({ label: "", amount: "" });
  const [cancelReason, setCancelReason] = useState("");
  const [officeForm, setOfficeForm] = useState({ amount: "", method: "cash", referenceNumber: "" });
  const [waiveReason, setWaiveReason] = useState("");

  const activeRule = rules?.find((r) => r.taxCategoryId === form.taxCategoryId && r.isActive);
  const categoryCode = activeRule?.taxCategory?.code ?? rules?.find((r) => r.taxCategoryId === form.taxCategoryId)?.taxCategory?.code ?? "";

  const doIssue = () => {
    setError(null);
    const parsedInputs: Record<string, number | string> = {};
    for (const [k, v] of Object.entries(inputs)) {
      if (v === "") continue;
      const n = Number(v);
      parsedInputs[k] = Number.isNaN(n) || k === "businessCategory" ? v : n;
    }
    issue.mutate(
      {
        taxCategoryId: form.taxCategoryId,
        fiscalYear: form.fiscalYear,
        propertyId: form.propertyId || undefined,
        userId: form.userId || undefined,
        discount: form.discount ? Number(form.discount) : undefined,
        inputs: parsedInputs,
      },
      {
        onSuccess: () => { setIssueOpen(false); setInputs({}); },
        onError: (e) => setError(getAuthErrorMessage(e)),
      },
    );
  };

  const doBulk = () => {
    setError(null);
    bulk.mutate(
      {
        taxCategoryId: bulkForm.taxCategoryId,
        fiscalYear: bulkForm.fiscalYear,
        ward: bulkForm.ward ? Number(bulkForm.ward) : undefined,
      },
      {
        onSuccess: (res) => setBulkResult({ issued: res.summary.issued, skipped: res.summary.skipped, skippedRows: res.skipped }),
        onError: (e) => setError(getAuthErrorMessage(e)),
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bills"
        description="Issue individual bills, run controlled bulk billing, amend or cancel with audit reasons."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => markOd.mutate()} disabled={markOd.isPending}>
              Mark overdue
            </Button>
            <Button variant="outline" onClick={() => setBulkOpen(true)}>
              <Layers className="mr-1 h-4 w-4" /> Bulk issue
            </Button>
            <Button onClick={() => setIssueOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Issue bill
            </Button>
          </div>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <Select value={status} onValueChange={(v) => setStatus(typeof v === "string" ? v : "all")}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="issued">Issued</SelectItem>
              <SelectItem value="partially_paid">Partially paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="void">Void</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />
            Overdue only
          </label>
        </CardContent>
      </Card>

      {error ? (
        <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      ) : null}

      {isLoading ? (
        <LoadingState label="Loading bills..." />
      ) : isError ? (
        <ErrorState message="Unable to load bills." onRetry={() => refetch()} />
      ) : !data || data.data.length === 0 ? (
        <Card><CardContent><EmptyState title="No bills" description="Issue the first bill for the fiscal year." /></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill No.</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Taxpayer</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Payable</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.billNumber}</TableCell>
                    <TableCell>{bill.taxCategory?.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {bill.user ? `${bill.user.firstName} ${bill.user.lastName}` : "—"}
                    </TableCell>
                    <TableCell>{bill.periodLabel}</TableCell>
                    <TableCell className="text-right tnum">{formatCurrency(bill.totalPayable)}</TableCell>
                    <TableCell className="text-right font-semibold tnum">
                      {formatCurrency(Number(bill.totalPayable) - Number(bill.amountPaid))}
                    </TableCell>
                    <TableCell><StatusBadge status={bill.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => { setSelected(bill); setAmendReason(""); setCancelReason(""); }}>
                        <Eye className="mr-1 h-3 w-3" /> Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Issue individual bill</DialogTitle>
            <DialogDescription>
              The amount is calculated server-side from the active rule. Duplicates
              for the same subject and period are rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Tax category (active rule)</Label>
              <Select value={form.taxCategoryId} onValueChange={(v) => v && setForm({ ...form, taxCategoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {(rules ?? []).filter((r) => r.isActive).map((r) => (
                    <SelectItem key={r.id} value={r.taxCategoryId}>
                      {r.taxCategory?.name} — {r.fiscalYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Fiscal year</Label><Input value={form.fiscalYear} onChange={(e) => setForm({ ...form, fiscalYear: e.target.value })} /></div>
              <div className="space-y-2"><Label>Discount (NPR)</Label><Input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Property ID (for property/land tax)</Label><Input value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })} placeholder="uuid of verified property" /></div>
            {(inputHints[categoryCode] ?? [{ key: "assessedValue", label: "Taxable base" }]).map((h) => (
              <div key={h.key} className="space-y-2">
                <Label>{h.label}</Label>
                <Input value={inputs[h.key] ?? ""} onChange={(e) => setInputs({ ...inputs, [h.key]: e.target.value })} />
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIssueOpen(false)}>Cancel</Button>
              <Button onClick={doIssue} disabled={issue.isPending || !form.taxCategoryId}>
                {issue.isPending ? "Issuing..." : "Issue bill"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Controlled bulk billing</DialogTitle>
            <DialogDescription>
              Issues bills for all verified properties in scope. Retries never
              create duplicates — already-billed subjects are reported as skipped.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Tax category</Label>
              <Select value={bulkForm.taxCategoryId} onValueChange={(v) => v && setBulkForm({ ...bulkForm, taxCategoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {(rules ?? []).filter((r) => r.isActive).map((r) => (
                    <SelectItem key={r.id} value={r.taxCategoryId}>{r.taxCategory?.name} — {r.fiscalYear}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Fiscal year</Label><Input value={bulkForm.fiscalYear} onChange={(e) => setBulkForm({ ...bulkForm, fiscalYear: e.target.value })} /></div>
              <div className="space-y-2"><Label>Ward (optional)</Label><Input type="number" value={bulkForm.ward} onChange={(e) => setBulkForm({ ...bulkForm, ward: e.target.value })} /></div>
            </div>
            {bulkResult ? (
              <div className="rounded-md bg-muted p-3 text-sm">
                <p>Issued: <strong>{bulkResult.issued}</strong> • Skipped: <strong>{bulkResult.skipped}</strong></p>
                {bulkResult.skippedRows.slice(0, 10).map((s, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{s.subject}: {s.reason}</p>
                ))}
              </div>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBulkOpen(false)}>Close</Button>
              <Button onClick={doBulk} disabled={bulk.isPending || !bulkForm.taxCategoryId}>
                {bulk.isPending ? "Issuing..." : "Run bulk issuance"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Manage {selected?.billNumber}</DialogTitle>
            <DialogDescription>
              Amendments create a superseding version — issued bills are never
              silently recalculated. All actions require a reason and are audited.
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-3">
                <span className="text-muted-foreground">Principal</span><span className="text-right font-medium">{formatCurrency(selected.principal)}</span>
                <span className="text-muted-foreground">Discount</span><span className="text-right">{formatCurrency(selected.discount)}</span>
                <span className="text-muted-foreground">Penalty</span><span className="text-right">{formatCurrency(selected.penalty)}</span>
                <span className="text-muted-foreground">Total payable</span><span className="text-right font-semibold">{formatCurrency(selected.totalPayable)}</span>
                <span className="text-muted-foreground">Paid</span><span className="text-right">{formatCurrency(selected.amountPaid)}</span>
                <span className="text-muted-foreground">Due</span><span className="text-right">{formatDate(selected.dueDate)}</span>
              </div>

              <div className="space-y-2 rounded-lg border p-3">
                <p className="font-medium">Amend bill (authorized adjustment)</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Adjustment label" value={amendAdj.label} onChange={(e) => setAmendAdj({ ...amendAdj, label: e.target.value })} />
                  <Input type="number" placeholder="Amount (+/-)" value={amendAdj.amount} onChange={(e) => setAmendAdj({ ...amendAdj, amount: e.target.value })} />
                </div>
                <Textarea placeholder="Reason (required, min 5 chars)" value={amendReason} onChange={(e) => setAmendReason(e.target.value)} />
                <Button
                  size="sm"
                  disabled={amend.isPending}
                  onClick={() =>
                    amend.mutate(
                      {
                        id: selected.id,
                        payload: {
                          adjustments: amendAdj.label && amendAdj.amount ? [{ label: amendAdj.label, amount: Number(amendAdj.amount) }] : [],
                          reason: amendReason,
                        },
                      },
                      { onSuccess: (b) => setSelected(b), onError: (e) => setError(getAuthErrorMessage(e)) },
                    )
                  }
                >
                  {amend.isPending ? "Amending..." : "Amend (new version)"}
                </Button>
              </div>

              <div className="space-y-2 rounded-lg border p-3">
                <p className="font-medium">Late-payment penalty</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={applyFine.isPending}
                    onClick={() =>
                      applyFine.mutate(
                        { billId: selected.id },
                        { onSuccess: () => refetch(), onError: (e) => setError(getAuthErrorMessage(e)) },
                      )
                    }
                  >
                    Apply configured % penalty
                  </Button>
                </div>
                {(billFines as Array<{ id: string; fineNumber: string; amount: number; percent: number; waived: boolean }> | undefined)?.length ? (
                  <div className="space-y-1">
                    {(billFines as Array<{ id: string; fineNumber: string; amount: number; percent: number; waived: boolean }>).map((f) => (
                      <div key={f.id} className="flex items-center justify-between rounded bg-muted px-2 py-1 text-xs">
                        <span>{f.fineNumber} — {f.percent}% = {formatCurrency(f.amount)} {f.waived ? "(waived)" : ""}</span>
                        {!f.waived ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={waiveFine.isPending || waiveReason.trim().length < 5}
                            onClick={() =>
                              waiveFine.mutate(
                                { id: f.id, reason: waiveReason },
                                { onSuccess: () => { refetchFines(); refetch(); }, onError: (e) => setError(getAuthErrorMessage(e)) },
                              )
                            }
                          >
                            Waive
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No fines recorded for this bill yet. Penalties are never applied twice for the same period.</p>
                )}
                <div className="flex gap-2">
                  <Input placeholder="Waiver reason (required, min 5 chars)" value={waiveReason} onChange={(e) => setWaiveReason(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2 rounded-lg border p-3">
                <p className="font-medium">Record office (cash) payment</p>
                <div className="grid grid-cols-3 gap-2">
                  <Input type="number" placeholder="Amount" value={officeForm.amount} onChange={(e) => setOfficeForm({ ...officeForm, amount: e.target.value })} />
                  <Select value={officeForm.method} onValueChange={(v) => v && setOfficeForm({ ...officeForm, method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="khalti">Khalti</SelectItem>
                      <SelectItem value="esewa">eSewa</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Ref no." value={officeForm.referenceNumber} onChange={(e) => setOfficeForm({ ...officeForm, referenceNumber: e.target.value })} />
                </div>
                <Button
                  size="sm"
                  disabled={officePay.isPending}
                  onClick={() =>
                    officePay.mutate(
                      { billId: selected.id, amount: Number(officeForm.amount), method: officeForm.method, referenceNumber: officeForm.referenceNumber || undefined },
                      { onSuccess: () => refetch(), onError: (e) => setError(getAuthErrorMessage(e)) },
                    )
                  }
                >
                  {officePay.isPending ? "Recording..." : "Record payment"}
                </Button>
              </div>

              <div className="space-y-2 rounded-lg border border-destructive/30 p-3">
                <p className="font-medium">Cancel bill</p>
                <Textarea placeholder="Cancellation reason (required)" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={cancel.isPending}
                  onClick={() =>
                    cancel.mutate(
                      { id: selected.id, reason: cancelReason },
                      { onSuccess: () => setSelected(null), onError: (e) => setError(getAuthErrorMessage(e)) },
                    )
                  }
                >
                  Cancel bill
                </Button>
              </div>

              {selected.calculationBreakdown ? (
                <details className="rounded-md bg-muted p-3 text-xs">
                  <summary className="cursor-pointer font-medium">Calculation breakdown (immutable record)</summary>
                  <pre className="mt-2 overflow-auto">{JSON.stringify(selected.calculationBreakdown, null, 2)}</pre>
                </details>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
