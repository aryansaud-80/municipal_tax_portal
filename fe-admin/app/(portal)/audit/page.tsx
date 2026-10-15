"use client";

import { useAuditEvents } from "@/features/employees/hooks";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";

export default function AuditPage() {
  const { data, isLoading, isError, refetch } = useAuditEvents();
  const rows = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Sensitive administrative and financial actions with actor and timestamp."
      />

      {isLoading ? (
        <LoadingState label="Loading audit events..." />
      ) : isError ? (
        <ErrorState message="Unable to load audit log." onRetry={() => refetch()} />
      ) : rows.length === 0 ? (
        <Card><CardContent><EmptyState title="No audit events yet" /></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(e.createdAt)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{e.action}</TableCell>
                    <TableCell className="text-xs">
                      {e.entity}
                      {e.entityId ? <span className="text-muted-foreground"> #{e.entityId.slice(0, 8)}</span> : null}
                    </TableCell>
                    <TableCell>
                      {e.actor ? `${e.actor.firstName} ${e.actor.lastName}` : "system"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                      {JSON.stringify(e.metadata ?? {})}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
