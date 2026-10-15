"use client";

import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { useApplications, useReviewApplication } from "@/features/verification/hooks";
import { PropertyApplication } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { formatDate, titleCase } from "@/lib/format";

export default function VerificationPage() {
  const [status, setStatus] = useState<string>("pending");
  const { data, isLoading, isError, refetch } = useApplications(status === "all" ? undefined : status);
  const [reviewing, setReviewing] = useState<PropertyApplication | null>(null);
  const [decision, setDecision] = useState<"approve" | "reject" | "request_correction">("approve");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const review = useReviewApplication();

  const submit = () => {
    if (!reviewing) return;
    if (decision !== "approve" && notes.trim().length < 5) {
      setError("A reason (min 5 characters) is required for rejection or correction requests.");
      return;
    }
    setError(null);
    review.mutate(
      { id: reviewing.id, payload: { decision, reviewNotes: notes || undefined } },
      {
        onSuccess: () => {
          setReviewing(null);
          setNotes("");
        },
        onError: (e) => setError(e instanceof Error ? e.message : "Review failed."),
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Property Verification"
        description="Review citizen registration requests — approve, reject with reason, or request corrections."
        actions={
          <Select value={status} onValueChange={(v) => setStatus(typeof v === "string" ? v : "pending")}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Queue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending queue</SelectItem>
              <SelectItem value="correction_requested">Correction requested</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {isLoading ? (
        <LoadingState label="Loading applications..." />
      ) : isError ? (
        <ErrorState message="Unable to load applications." onRetry={() => refetch()} />
      ) : !data || data.data.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState title="Queue is clear" description="No applications in this state." />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.data.map((app) => (
            <Card key={app.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ClipboardCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{app.applicationNumber}</CardTitle>
                      <CardDescription>
                        {app.applicant ? `${app.applicant.firstName} ${app.applicant.lastName} • ` : ""}
                        {app.applicant?.email} • {formatDate(app.createdAt)}
                      </CardDescription>
                    </div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span className="font-medium">{app.ownerName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="text-right font-medium">{app.address}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Ward / Type</span><span>Ward {app.ward} • {titleCase(app.propertyType)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Area</span><span>{Number(app.areaSqMeters).toLocaleString()} m²</span></div>
                {app.landOwnershipNumber ? (
                  <div className="flex justify-between"><span className="text-muted-foreground">Land ownership no.</span><span>{app.landOwnershipNumber}</span></div>
                ) : null}
                {app.reviewNotes ? (
                  <div className="rounded-md bg-muted p-3"><p className="text-xs font-medium uppercase text-muted-foreground">Last review note</p><p>{app.reviewNotes}</p></div>
                ) : null}
                {app.status === "pending" || app.status === "correction_requested" ? (
                  <div className="pt-1">
                    <Button size="sm" onClick={() => { setReviewing(app); setDecision("approve"); setNotes(""); setError(null); }}>
                      Review application
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!reviewing} onOpenChange={(o) => !o && setReviewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review {reviewing?.applicationNumber}</DialogTitle>
            <DialogDescription>
              Approval creates a verified property and ownership record. Rejections
              and correction requests require a written reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Decision</Label>
              <Select value={decision} onValueChange={(v) => v && setDecision(v as typeof decision)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve — verify property</SelectItem>
                  <SelectItem value="request_correction">Request corrections</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Review note{decision === "approve" ? " (optional)" : " (required)"}</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason, missing documents, or verification remark..." />
            </div>
            {error ? (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReviewing(null)}>Cancel</Button>
              <Button onClick={submit} disabled={review.isPending}>
                {review.isPending ? "Recording..." : "Record decision"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
