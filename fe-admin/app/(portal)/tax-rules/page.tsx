"use client";

import { useState } from "react";
import { Settings2, Plus } from "lucide-react";
import {
  useTaxRules,
  useCreateTaxRule,
  useDeactivateTaxRule,
} from "@/features/tax-rules/hooks";
import { getAuthErrorMessage } from "@/features/auth/hooks";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DatePicker } from "@/components/ui/datepicker";
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
import { titleCase } from "@/lib/format";

const categories = [
  { code: "property_tax", label: "Property Tax" },
  { code: "house_rent_tax", label: "House Rent Tax" },
  { code: "business_tax", label: "Business Tax" },
  { code: "land_tax", label: "Land Tax" },
  { code: "advertisement_tax", label: "Advertisement Tax" },
];

export default function TaxRulesPage() {
  const { data, isLoading, isError, refetch } = useTaxRules();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    fiscalYear: "2082/83",
    billingPeriod: "annual",
    effectiveFrom: "2025-07-16",
    rateType: "percentage",
    rate: "1",
    minAmount: "0",
    penaltyPercent: "5",
    penaltyBase: "outstanding",
    graceDays: "7",
    dueDate: "2026-04-13",
  });
  const create = useCreateTaxRule();
  const deactivate = useDeactivateTaxRule();

  const [catLookup, setCatLookup] = useState<Record<string, string>>({});

  const submit = (taxCategoryId: string) => {
    setError(null);
    create.mutate(
      {
        taxCategoryId,
        name: form.name || undefined,
        fiscalYear: form.fiscalYear,
        billingPeriod: form.billingPeriod,
        effectiveFrom: form.effectiveFrom,
        rateType: form.rateType,
        rate: Number(form.rate),
        minAmount: Number(form.minAmount),
        penaltyPercent: Number(form.penaltyPercent),
        penaltyBase: form.penaltyBase,
        graceDays: Number(form.graceDays),
        dueDate: form.dueDate || undefined,
      } as unknown as Record<string, unknown>,
      {
        onSuccess: () => setOpen(false),
        onError: (e) => setError(getAuthErrorMessage(e)),
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax Rules"
        description="Configure rates, billing periods, due dates and penalties per category and fiscal year. Changes never rewrite issued bills."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> New rule
          </Button>
        }
      />

      {error ? (
        <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      ) : null}

      {isLoading ? (
        <LoadingState label="Loading tax rules..." />
      ) : isError ? (
        <ErrorState message="Unable to load tax rules." onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <Card><CardContent><EmptyState title="No rules configured" description="Create one rule per category and fiscal year." /></CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.map((rule) => (
            <Card key={rule.id} className={!rule.isActive ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Settings2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{rule.name}</CardTitle>
                      <CardDescription>
                        {rule.taxCategory?.name} • FY {rule.fiscalYear} • {titleCase(rule.billingPeriod)}
                      </CardDescription>
                    </div>
                  </div>
                  <StatusBadge status={rule.isActive ? "active" : "inactive"} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span className="font-medium">{rule.rateType === "fixed" ? `Fixed ${rule.fixedAmount ?? rule.rate}` : `${rule.rate}%`}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Minimum charge</span><span>{rule.minAmount}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Penalty</span><span>{rule.penaltyPercent}% of {titleCase(rule.penaltyBase)} • {rule.graceDays}d grace</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Effective</span><span>{rule.effectiveFrom}{rule.effectiveTo ? ` → ${rule.effectiveTo}` : " → …"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Due date</span><span>{rule.dueDate ?? "—"}</span></div>
                {rule.isActive ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={deactivate.isPending}
                    onClick={() => deactivate.mutate(rule.id, { onError: (e) => setError(getAuthErrorMessage(e)) })}
                  >
                    Deactivate
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New tax rule (demonstration values)</DialogTitle>
            <DialogDescription>
              Enter municipal-approved figures — the system ships with no official
              rates. Overlapping active rules for the same category, year and period
              are rejected.
            </DialogDescription>
          </DialogHeader>
          <RuleForm
            form={form}
            setForm={setForm}
            catLookup={catLookup}
            setCatLookup={setCatLookup}
            onSubmit={submit}
            pending={create.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

type RuleFormState = {
  name: string;
  fiscalYear: string;
  billingPeriod: string;
  effectiveFrom: string;
  rateType: string;
  rate: string;
  minAmount: string;
  penaltyPercent: string;
  penaltyBase: string;
  graceDays: string;
  dueDate: string;
};

function RuleForm({
  form,
  setForm,
  onSubmit,
  pending,
}: {
  form: RuleFormState;
  setForm: (f: RuleFormState) => void;
  catLookup: Record<string, string>;
  setCatLookup: (m: Record<string, string>) => void;
  onSubmit: (taxCategoryId: string) => void;
  pending: boolean;
}) {
  const [taxCategoryId, setTaxCategoryId] = useState("");
  const set = (k: string) => (e: { target: { value: string } }) =>
    setForm({ ...form, [k]: e.target.value });
  return (
    <div className="grid gap-3">
      <div className="space-y-2">
        <Label>Tax category ID (from Tax Categories page)</Label>
        <Input value={taxCategoryId} onChange={(e) => setTaxCategoryId(e.target.value)} placeholder="uuid of the tax category" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label>Rule name</Label><Input value={form.name} onChange={set("name")} placeholder="e.g. Property Tax 2082/83" /></div>
        <div className="space-y-2"><Label>Fiscal year</Label><Input value={form.fiscalYear} onChange={set("fiscalYear")} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Billing period</Label>
          <Select value={form.billingPeriod} onValueChange={(v) => v && setForm({ ...form, billingPeriod: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="annual">Annual</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="one_time">One-time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Rate type</Label>
          <Select value={form.rateType} onValueChange={(v) => v && setForm({ ...form, rateType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed">Fixed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2"><Label>Rate</Label><Input type="number" value={form.rate} onChange={set("rate")} /></div>
        <div className="space-y-2"><Label>Min. charge</Label><Input type="number" value={form.minAmount} onChange={set("minAmount")} /></div>
        <div className="space-y-2"><Label>Grace days</Label><Input type="number" value={form.graceDays} onChange={set("graceDays")} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2"><Label>Penalty %</Label><Input type="number" value={form.penaltyPercent} onChange={set("penaltyPercent")} /></div>
        <div className="space-y-2">
          <Label>Penalty base</Label>
          <Select value={form.penaltyBase} onValueChange={(v) => v && setForm({ ...form, penaltyBase: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="outstanding">Outstanding balance</SelectItem>
              <SelectItem value="principal">Original principal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DatePicker id="rule-due-date" label="Due date" value={form.dueDate} onChange={(v) => setForm({ ...form, dueDate: v })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <DatePicker id="rule-effective-from" label="Effective from" value={form.effectiveFrom} onChange={(v) => setForm({ ...form, effectiveFrom: v })} />
      </div>
      <div className="flex justify-end">
        <Button onClick={() => onSubmit(taxCategoryId)} disabled={pending || !taxCategoryId}>
          {pending ? "Saving..." : "Create rule"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Categories: {categories.map((c) => c.label).join(" • ")}. Find category IDs on the Tax Categories page.
      </p>
    </div>
  );
}
