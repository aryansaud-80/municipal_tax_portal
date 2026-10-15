"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  ReceiptText,
  Building2,
  MessageSquarePlus,
  ArrowRight,
  CalendarClock,
  Copy,
  Check,
  Mail,
  Phone,
} from "lucide-react";
import { useCitizenDashboard } from "@/features/dashboard/hooks";
import { useMyBills } from "@/features/bills/hooks";
import { useMe } from "@/features/auth/hooks";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { StatusPill } from "@/components/shared/StatusPill";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/format";

const OFFICE_EMAIL = "support@municipality.gov.np";
const OFFICE_PHONE = "+977-01-4000000";

function QueryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const send = () => {
    const href = `mailto:${OFFICE_EMAIL}?subject=${encodeURIComponent(subject || "Citizen query")}&body=${encodeURIComponent(message)}`;
    window.location.href = href;
    onOpenChange(false);
  };

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(OFFICE_PHONE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raise a query</DialogTitle>
          <DialogDescription>
            Send your question to the municipal revenue office by email, or call the helpline.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Subject" htmlFor="query-subject">
            <Input
              id="query-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Wrong amount on bill BILL-000012"
            />
          </Field>
          <Field label="Message" htmlFor="query-message">
            <Textarea
              id="query-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your query with bill or property numbers…"
            />
          </Field>
          <div className="flex flex-wrap items-center gap-2 rounded-[10px] border p-3 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" aria-hidden />
            <span className="font-medium tnum">{OFFICE_PHONE}</span>
            <span className="text-xs text-muted-foreground">Sun–Fri, 10am–5pm</span>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={copyPhone}>
              {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={send} disabled={!subject.trim() || !message.trim()}>
              <Mail className="h-4 w-4" aria-hidden /> Send via email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: user } = useMe();
  const dash = useCitizenDashboard();
  const bills = useMyBills();
  const [queryOpen, setQueryOpen] = useState(false);

  const dues = useMemo(() => {
    const list = (bills.data ?? []).filter((b) =>
      ["issued", "partially_paid", "overdue"].includes(b.status),
    );
    const total = list.reduce((s, b) => s + (Number(b.totalPayable) - Number(b.amountPaid)), 0);
    const upcoming = [...list].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5);
    return { list, total, upcoming };
  }, [bills.data]);

  if (dash.isLoading || bills.isLoading) return <LoadingState label="Loading your dashboard..." />;
  if (dash.isError || !dash.data) {
    return <ErrorState message="Unable to load dashboard." onRetry={() => dash.refetch()} />;
  }
  const data = dash.data;

  const quickActions = [
    { label: "Pay tax", icon: Wallet, href: "/taxes" },
    { label: "Download receipt", icon: ReceiptText, href: "/receipts" },
    { label: "View properties", icon: Building2, href: "/properties" },
    { label: "Raise a query", icon: MessageSquarePlus, action: () => setQueryOpen(true) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.firstName ?? "Citizen"}`}
        description="Here's an overview of your tax account."
      />

      {/* Hero: total due */}
      <section
        aria-label="Total amount due"
        className="rounded-[14px] bg-primary p-6 text-primary-foreground sm:p-8"
      >
        <p className="text-xs font-medium tracking-wide uppercase opacity-80">Total due</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight tnum">
          {formatCurrency(dues.total)}
        </p>
        <p className="mt-1 text-sm opacity-80">
          {dues.list.length === 0
            ? "All clear — no unpaid bills."
            : `${dues.list.length} unpaid bill${dues.list.length > 1 ? "s" : ""}${
                dues.upcoming[0] ? ` · next due ${formatDate(dues.upcoming[0].dueDate)}` : ""
              }`}
        </p>
        {dues.list.length > 0 ? (
          <Button
            variant="secondary"
            size="lg"
            className="mt-4 w-full border-white/30 bg-white text-primary hover:bg-white/90 sm:w-auto"
            onClick={() => router.push("/taxes")}
          >
            Pay now <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
          </Button>
        ) : null}
      </section>

      {/* Quick actions */}
      <section aria-label="Quick actions" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {quickActions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              onClick={() => ("href" in a && a.href ? router.push(a.href) : a.action?.())}
              className="flex items-center gap-3 rounded-[14px] border bg-surface p-4 text-left transition-colors duration-150 hover:border-primary/40"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-sm font-medium">{a.label}</span>
            </button>
          );
        })}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-[18px] w-[18px] text-muted-foreground" aria-hidden />
              Upcoming due dates
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push("/taxes")}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            {dues.upcoming.length === 0 ? (
              <EmptyState title="Nothing due" description="Upcoming bills and due dates will appear here." />
            ) : (
              <ul className="space-y-2">
                {dues.upcoming.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-3 rounded-[10px] border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{b.taxCategory?.name}</p>
                      <p className="text-xs text-muted-foreground tnum">
                        {b.billNumber} · due {formatDate(b.dueDate)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-semibold tnum">
                        {formatCurrency(Number(b.totalPayable) - Number(b.amountPaid))}
                      </span>
                      <StatusPill status={b.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent payments</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push("/payments")}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentPayments.length === 0 ? (
              <EmptyState title="No payments yet" />
            ) : (
              <ul className="space-y-2">
                {data.recentPayments.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-[10px] border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium tnum">{p.paymentNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-semibold tnum">{formatCurrency(p.amount)}</span>
                      <StatusPill status={p.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <QueryDialog open={queryOpen} onOpenChange={setQueryOpen} />
    </div>
  );
}
