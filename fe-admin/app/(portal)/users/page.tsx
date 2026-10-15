"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useUsers,
  useToggleUserStatus,
  useCreateUser,
  getCreateUserErrorMessage,
} from "@/features/users/hooks";
import type { User } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, ErrorState } from "@/components/shared/States";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable, type DataColumn } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Search, UserPlus } from "lucide-react";
import { formatDate } from "@/lib/format";

const roleOptions = [
  { code: "CITIZEN", label: "Citizen" },
  { code: "MUNICIPAL_ADMIN", label: "Municipal Admin" },
  { code: "REVENUE_OFFICER", label: "Revenue Officer" },
  { code: "CASHIER", label: "Cashier" },
  { code: "AUDITOR", label: "Auditor" },
];

const createUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_.]+$/, "Only letters, numbers, underscores and dots"),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, "Enter a valid phone number"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[a-z]/, "Must include a lowercase letter")
    .regex(/[0-9]/, "Must include a number"),
  roleCode: z.string().min(1, "Role is required"),
});

type CreateUserValues = z.infer<typeof createUserSchema>;

const columns: DataColumn<User>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    sortValue: (u) => `${u.firstName} ${u.lastName}`,
    render: (u) => (
      <span>
        <span className="font-medium">
          {u.firstName} {u.lastName}
        </span>
        {u.emailVerified ? <span className="text-success"> ✓</span> : null}
      </span>
    ),
  },
  {
    key: "email",
    header: "Email",
    sortable: true,
    sortValue: (u) => u.email,
    render: (u) => <span className="text-muted-foreground">{u.email}</span>,
  },
  {
    key: "username",
    header: "Username",
    render: (u) => <span className="text-muted-foreground tnum">@{u.username}</span>,
  },
  {
    key: "phone",
    header: "Phone",
    render: (u) => <span className="text-muted-foreground tnum">{u.phoneNumber ?? "—"}</span>,
  },
  {
    key: "status",
    header: "Status",
    render: (u) => <StatusBadge status={u.status} />,
  },
];

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [confirming, setConfirming] = useState<User | null>(null);
  const toggle = useToggleUserStatus();
  const create = useCreateUser();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      phoneNumber: "",
      password: "",
      roleCode: "CITIZEN",
    },
  });

  const selectedRole = watch("roleCode");

  const { data, isLoading, isError, refetch } = useUsers({
    page,
    limit: 10,
    search: appliedSearch || undefined,
  });

  const onSubmit = (values: CreateUserValues) => {
    create.mutate(values, {
      onSuccess: () => {
        setDialogOpen(false);
        reset();
      },
    });
  };

  const applySearch = () => {
    setPage(1);
    setAppliedSearch(search);
  };

  if (isLoading) return <LoadingState label="Loading users..." />;
  if (isError || !data) {
    return <ErrorState message="Unable to load users." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage registered municipal accounts."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="h-4 w-4" aria-hidden /> Add user
          </Button>
        }
      />

      <DataTable<User>
        columns={[
          ...columns,
          {
            key: "actions",
            header: "Actions",
            hideable: false,
            render: (u) => (
              <span className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setSelected(u)}>
                  Details
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={toggle.isPending}
                  onClick={() => setConfirming(u)}
                >
                  {u.status === "active" ? "Deactivate" : "Activate"}
                </Button>
              </span>
            ),
          },
        ]}
        rows={data.data}
        keyOf={(u) => u.id}
        loading={isLoading}
        emptyTitle="No users found"
        emptyDescription="Try a different search, or add the first account."
        filters={
          <div className="relative w-full md:max-w-xs">
            <Search
              className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              className="pl-9"
              placeholder="Search by name or email…"
              aria-label="Search users"
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
        ariaLabel="Users"
      />
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {selected?.firstName} {selected?.lastName}
            </SheetTitle>
            <SheetDescription className="tnum">{selected?.email}</SheetDescription>
          </SheetHeader>
          {selected ? (
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Username</dt>
                <dd className="font-medium tnum">@{selected.username}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="font-medium tnum">{selected.phoneNumber ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Status</dt>
                <dd><StatusBadge status={selected.status} /></dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Email verified</dt>
                <dd>{selected.emailVerified ? "Yes" : "No"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Registered</dt>
                <dd>{selected.createdAt ? formatDate(selected.createdAt) : "—"}</dd>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="secondary"
                  disabled={toggle.isPending}
                  onClick={() => setConfirming(selected)}
                >
                  {selected.status === "active" ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </dl>
          ) : null}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!confirming}
        onOpenChange={(o) => !o && setConfirming(null)}
        title={`${confirming?.status === "active" ? "Deactivate" : "Activate"} ${confirming?.firstName} ${confirming?.lastName ?? ""}?`}
        description="The user will immediately lose (or regain) portal access."
        confirmLabel={confirming?.status === "active" ? "Deactivate" : "Activate"}
        loading={toggle.isPending}
        onConfirm={() => {
          if (!confirming) return;
          toggle.mutate(
            { id: confirming.id, isActive: confirming.status !== "active" },
            { onSuccess: () => setConfirming(null) },
          );
        }}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>
              Create a municipal account. The user logs in with the email and
              password you set here.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" htmlFor="firstName" error={errors.firstName?.message} required>
              <Input placeholder="Ram" {...register("firstName")} />
            </Field>
            <Field label="Last name" htmlFor="lastName" error={errors.lastName?.message} required>
              <Input placeholder="Bahadur" {...register("lastName")} />
            </Field>
            <Field label="Email" htmlFor="email" error={errors.email?.message} required>
              <Input type="email" placeholder="ram@example.com" {...register("email")} />
            </Field>
            <Field label="Username" htmlFor="username" error={errors.username?.message} required>
              <Input placeholder="ram.bahadur" {...register("username")} />
            </Field>
            <Field label="Phone number" htmlFor="phoneNumber" error={errors.phoneNumber?.message} required>
              <Input placeholder="9800000000" {...register("phoneNumber")} />
            </Field>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="role">Role</label>
              <Select
                value={selectedRole}
                onValueChange={(v) =>
                  setValue("roleCode", v ?? "CITIZEN", { shouldValidate: true })
                }
              >
                <SelectTrigger id="role" className="w-full">
                  <SelectValue>
                    {roleOptions.find((r) => r.code === selectedRole)?.label ?? "Select role"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((r) => (
                    <SelectItem key={r.code} value={r.code}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Field label="Password" htmlFor="password" error={errors.password?.message} required>
                <Input type="password" placeholder="••••••••" {...register("password")} />
              </Field>
            </div>

            {create.isError ? (
              <div role="alert" className="rounded-[10px] bg-danger/10 px-4 py-3 text-sm text-danger sm:col-span-2">
                {getCreateUserErrorMessage(create.error)}
              </div>
            ) : null}

            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={create.isPending}>
                {create.isPending ? "Creating..." : "Create user"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
