"use client";

import { useState } from "react";
import { useProperties } from "@/features/properties/hooks";
import type { Property } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, ErrorState } from "@/components/shared/States";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable, type DataColumn } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Search } from "lucide-react";
import { titleCase } from "@/lib/format";

const columns: DataColumn<Property>[] = [
  {
    key: "number",
    header: "Property No.",
    sortable: true,
    sortValue: (p) => p.propertyNumber,
    render: (p) => <span className="font-medium tnum">{p.propertyNumber}</span>,
  },
  {
    key: "owner",
    header: "Owner",
    sortable: true,
    sortValue: (p) => p.ownerName,
    render: (p) => <span>{p.ownerName}</span>,
  },
  {
    key: "address",
    header: "Address",
    render: (p) => <span className="text-muted-foreground">{p.address}</span>,
  },
  {
    key: "ward",
    header: "Ward",
    sortable: true,
    numeric: true,
    sortValue: (p) => p.ward,
    render: (p) => <span className="text-muted-foreground tnum">{p.ward}</span>,
  },
  {
    key: "type",
    header: "Type",
    render: (p) => (
      <span className="text-muted-foreground">{titleCase(p.propertyType)}</span>
    ),
  },
  {
    key: "verification",
    header: "Verification",
    render: (p) => (
      <StatusBadge
        status={(p as { verificationStatus?: string }).verificationStatus ?? "unverified"}
      />
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (p) => <StatusBadge status={p.status} />,
  },
];

export default function PropertiesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selected, setSelected] = useState<Property | null>(null);
  const { data, isLoading, isError, refetch } = useProperties({
    page,
    limit: 10,
    search: appliedSearch || undefined,
  });

  const applySearch = () => {
    setPage(1);
    setAppliedSearch(search);
  };

  if (isLoading) return <LoadingState label="Loading properties..." />;
  if (isError || !data) {
    return <ErrorState message="Unable to load properties." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        description="Verified properties. New registrations arrive via the Verification queue — direct creation stays unverified until reviewed."
      />

      <DataTable<Property>
        columns={[
          ...columns,
          {
            key: "actions",
            header: "Actions",
            hideable: false,
            render: (p) => (
              <span className="flex justify-end">
                <Button variant="secondary" size="sm" onClick={() => setSelected(p)}>
                  Details
                </Button>
              </span>
            ),
          },
        ]}
        rows={data.data}
        keyOf={(p) => p.id}
        loading={isLoading}
        emptyTitle="No properties found"
        emptyDescription="Verified properties appear here after application approval."
        filters={
          <div className="relative w-full md:max-w-xs">
            <Search
              className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              className="pl-9"
              placeholder="Search number, owner, address…"
              aria-label="Search properties"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
            />
          </div>
        }
        page={page}
        totalPages={data.meta.totalPages}
        onPageChange={setPage}
        ariaLabel="Properties"
      />

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="tnum">{selected?.propertyNumber}</SheetTitle>
            <SheetDescription>{selected?.ownerName}</SheetDescription>
          </SheetHeader>
          {selected ? (
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Address</dt>
                <dd className="text-right font-medium">{selected.address}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Ward / Tole</dt>
                <dd className="tnum">
                  {selected.ward} {selected.tole ? `• ${selected.tole}` : ""}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Type</dt>
                <dd>{titleCase(selected.propertyType)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Area</dt>
                <dd className="tnum">{Number(selected.areaSqMeters).toLocaleString()} m²</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Verification</dt>
                <dd>
                  <StatusBadge
                    status={(selected as { verificationStatus?: string }).verificationStatus ?? "unverified"}
                  />
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Status</dt>
                <dd><StatusBadge status={selected.status} /></dd>
              </div>
            </dl>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
