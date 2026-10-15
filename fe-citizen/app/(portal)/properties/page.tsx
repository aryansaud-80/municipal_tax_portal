"use client";

import { useState } from "react";
import { Building2, Plus, Upload, RefreshCcw } from "lucide-react";
import { useMyProperties } from "@/features/properties/hooks";
import {
  useMyApplications,
  useSubmitApplication,
  useResubmitApplication,
  useUploadDocument,
} from "@/features/applications/hooks";
import { CreatePropertyPayload } from "@/features/properties/api";
import { PropertyApplication } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusPill } from "@/components/shared/StatusPill";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/format";
import { PropertyForm } from "@/components/forms/PropertyForm";
import { getAuthErrorMessage } from "@/features/auth/hooks";

const appHelp: Record<string, string> = {
  pending: "Your application is waiting for municipal review.",
  correction_requested: "The reviewer asked for corrections — update and resubmit below.",
  approved: "Approved. Your verified property is listed under My Properties.",
  rejected: "Rejected. See the reason below; you may correct and resubmit.",
};

function ApplicationCard({
  app,
  onResubmit,
  onUpload,
}: {
  app: PropertyApplication;
  onResubmit: (app: PropertyApplication) => void;
  onUpload: (app: PropertyApplication, file: File) => void;
}) {
  const canResubmit = app.status === "correction_requested" || app.status === "rejected";
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{app.applicationNumber}</CardTitle>
            <CardDescription>
              {app.ownerName} • Ward {app.ward} • {formatDate(app.createdAt)}
            </CardDescription>
          </div>
          <StatusPill status={app.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-muted-foreground">{appHelp[app.status]}</p>
        <p><span className="text-muted-foreground">Address: </span>{app.address}</p>
        {app.reviewNotes ? (
          <div className="rounded-[10px] bg-muted p-3">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Reviewer note</p>
            <p className="mt-0.5">{app.reviewNotes}</p>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          {canResubmit ? (
            <Button size="sm" variant="outline" onClick={() => onResubmit(app)}>
              <RefreshCcw className="mr-1 h-3 w-3" /> Correct & resubmit
            </Button>
          ) : null}
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border px-3 py-2 text-sm font-medium transition-colors duration-150 hover:border-primary/40 hover:text-primary">
            <Upload className="h-4 w-4" aria-hidden /> Upload document
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(app, f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PropertiesPage() {
  const [open, setOpen] = useState(false);
  const [resubmitting, setResubmitting] = useState<PropertyApplication | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const props = useMyProperties();
  const apps = useMyApplications();
  const submit = useSubmitApplication();
  const resubmit = useResubmitApplication();
  const upload = useUploadDocument();

  const handleCreate = (values?: CreatePropertyPayload) => {
    if (!values) return;
    setNotice(null);
    submit.mutate(values, {
      onSuccess: () => setOpen(false),
      onError: (e) => setNotice(getAuthErrorMessage(e)),
    });
  };

  const handleResubmit = (values?: CreatePropertyPayload) => {
    if (!resubmitting || !values) return;
    resubmit.mutate(
      { id: resubmitting.id, payload: values },
      {
        onSuccess: () => setResubmitting(null),
        onError: (e) => setNotice(getAuthErrorMessage(e)),
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Properties"
        description="Submit registration requests, track verification, and view verified properties."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> New application
          </Button>
        }
      />

      {notice ? (
        <div role="alert" className="rounded-[10px] bg-danger/10 px-4 py-3 text-sm text-danger">{notice}</div>
      ) : null}

      <Tabs defaultValue="properties">
        <TabsList>
          <TabsTrigger value="properties">Verified properties</TabsTrigger>
          <TabsTrigger value="applications">
            Applications{apps.data ? ` (${apps.data.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="mt-4">
          {props.isLoading ? (
            <LoadingState label="Loading your properties..." />
          ) : props.isError ? (
            <ErrorState message="Unable to load properties." onRetry={() => props.refetch()} />
          ) : !props.data || props.data.length === 0 ? (
            <Card>
              <CardContent>
                <EmptyState
                  title="No verified properties yet"
                  description="Submit a registration request — it appears here once the municipality verifies it."
                  action={
                    <Button onClick={() => setOpen(true)}>
                      <Plus className="mr-1 h-4 w-4" /> New application
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {props.data.map((property) => (
                <Card key={property.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
                        <Building2 className="h-5 w-5" aria-hidden />
                      </div>
                      <StatusPill status={property.propertyType} />
                    </div>
                    <CardTitle className="mt-3 text-base">{property.ownerName}</CardTitle>
                    <CardDescription className="tnum">{property.propertyNumber}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Address</span>
                      <span className="text-right font-medium">{property.address}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Ward</span>
                      <span className="font-medium tnum">{property.ward}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Area</span>
                      <span className="font-medium tnum">{Number(property.areaSqMeters).toLocaleString()} m²</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Verification</span>
                      <StatusPill status={(property as { verificationStatus?: string }).verificationStatus ?? property.status} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applications" className="mt-4">
          {apps.isLoading ? (
            <LoadingState label="Loading applications..." />
          ) : apps.isError ? (
            <ErrorState message="Unable to load applications." onRetry={() => apps.refetch()} />
          ) : !apps.data || apps.data.length === 0 ? (
            <Card>
              <CardContent>
                <EmptyState title="No applications yet" description="Your pending, approved and rejected requests will be tracked here." />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {apps.data.map((app) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  onResubmit={setResubmitting}
                  onUpload={(a, f) =>
                    upload.mutate(
                      { id: a.id, file: f },
                      { onError: (e) => setNotice(getAuthErrorMessage(e)) },
                    )
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Property registration request</DialogTitle>
            <DialogDescription>
              Your request enters a pending queue. A municipal employee reviews
              the details and documents before the property is verified.
            </DialogDescription>
          </DialogHeader>
          <PropertyForm onDone={handleCreate} pending={submit.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!resubmitting} onOpenChange={(o) => !o && setResubmitting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Correct & resubmit {resubmitting?.applicationNumber}</DialogTitle>
            <DialogDescription>{resubmitting?.reviewNotes}</DialogDescription>
          </DialogHeader>
          <PropertyForm
            onDone={handleResubmit}
            pending={resubmit.isPending}
            initial={{
              ownerName: resubmitting?.ownerName ?? "",
              address: resubmitting?.address ?? "",
              ward: resubmitting?.ward ?? 1,
              tole: resubmitting?.tole ?? "",
              areaSqMeters: Number(resubmitting?.areaSqMeters ?? 0),
              propertyType: resubmitting?.propertyType ?? "residential",
              landOwnershipNumber: resubmitting?.landOwnershipNumber ?? "",
              floorCount: resubmitting?.floorCount ?? 1,
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
