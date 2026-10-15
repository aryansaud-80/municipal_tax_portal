"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useEmployeeProfiles, useUpsertEmployeeProfile } from "@/features/employees/hooks";
import { getAuthErrorMessage } from "@/features/auth/hooks";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function EmployeesPage() {
  const { data, isLoading, isError, refetch } = useEmployeeProfiles();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    userId: "",
    position: "",
    wardAssignments: "",
    canVerifyPayments: false,
    canAssess: false,
    canApproveProperty: false,
  });
  const upsert = useUpsertEmployeeProfile();

  const submit = () => {
    setError(null);
    upsert.mutate(
      {
        userId: form.userId,
        position: form.position || undefined,
        wardAssignments: form.wardAssignments
          ? form.wardAssignments.split(",").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n))
          : [],
        canVerifyPayments: form.canVerifyPayments,
        canAssess: form.canAssess,
        canApproveProperty: form.canApproveProperty,
      },
      {
        onSuccess: () => setOpen(false),
        onError: (e) => setError(getAuthErrorMessage(e)),
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Ward assignments and duty flags. You cannot edit your own profile; admin accounts need Super Admin."
        actions={<Button onClick={() => setOpen(true)}>Assign / update profile</Button>}
      />

      {error ? (
        <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      ) : null}

      {isLoading ? (
        <LoadingState label="Loading employee profiles..." />
      ) : isError ? (
        <ErrorState message="Unable to load profiles." onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <Card><CardContent><EmptyState title="No employee profiles" description="Assign ward scopes and duties to staff accounts." /></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Wards</TableHead>
                  <TableHead>Duties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.user ? `${p.user.firstName} ${p.user.lastName}` : p.userId}
                    </TableCell>
                    <TableCell>{p.position ?? "—"}</TableCell>
                    <TableCell>{p.wardAssignments.length === 0 ? "All wards" : p.wardAssignments.join(", ")}</TableCell>
                    <TableCell className="space-x-1">
                      {p.canVerifyPayments ? <Badge variant="outline">Verify payments</Badge> : null}
                      {p.canAssess ? <Badge variant="outline">Assess</Badge> : null}
                      {p.canApproveProperty ? <Badge variant="outline">Approve property</Badge> : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Employee profile</DialogTitle>
            <DialogDescription>
              Empty ward list means all wards. Privilege changes are audit-logged.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2"><Label>User ID (uuid)</Label><Input value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} placeholder="Find users on the Users page" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Position</Label><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Revenue Officer" /></div>
              <div className="space-y-2"><Label>Wards (comma separated)</Label><Input value={form.wardAssignments} onChange={(e) => setForm({ ...form, wardAssignments: e.target.value })} placeholder="1, 2, 5" /></div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              {(
                [
                  ["canVerifyPayments", "Can verify payments"],
                  ["canAssess", "Can assess tax"],
                  ["canApproveProperty", "Can approve property"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4" /> Self-edits and silent privilege escalation are blocked server-side.
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={upsert.isPending || !form.userId}>
                {upsert.isPending ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
