"use client";

import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateProperty } from "@/features/properties/hooks";
import { CreatePropertyPayload } from "@/features/properties/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  ownerName: z.string().min(1, "Owner name is required"),
  address: z.string().min(1, "Address is required"),
  ward: z.coerce.number().int().min(1, "Ward 1-35").max(35, "Ward 1-35"),
  tole: z.string().optional(),
  areaSqMeters: z.coerce.number().positive("Area must be positive"),
  propertyType: z.string().min(1, "Select a property type"),
  landOwnershipNumber: z.string().optional(),
  floorCount: z.coerce.number().int().min(1).optional(),
  buildingAgeYears: z.coerce.number().int().min(0).optional(),
});

type Values = z.infer<typeof schema>;

export function PropertyForm({
  onDone,
  pending,
  initial,
}: {
  onDone: (values?: Values | CreatePropertyPayload) => void;
  pending?: boolean;
  initial?: Partial<Values>;
}) {
  const create = useCreateProperty();
  const controlled = typeof pending === "boolean";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema) as Resolver<Values>,
    defaultValues: {
      ownerName: "",
      address: "",
      ward: 1,
      tole: "",
      areaSqMeters: 0,
      propertyType: "residential",
      landOwnershipNumber: "",
      floorCount: 1,
      buildingAgeYears: 0,
      ...initial,
    },
  });

  const propertyType = watch("propertyType");

  const onSubmit = (values: Values) => {
    const payload = {
      ownerName: values.ownerName,
      address: values.address,
      ward: values.ward,
      tole: values.tole,
      areaSqMeters: values.areaSqMeters,
      propertyType: values.propertyType,
      landOwnershipNumber: values.landOwnershipNumber,
      floorCount: values.floorCount,
      buildingAgeYears: values.buildingAgeYears,
    };
    if (controlled) {
      onDone(payload);
      return;
    }
    create.mutate(payload, {
      onSuccess: () => onDone(),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!controlled && create.isError ? (
        <div role="alert" className="rounded-[10px] bg-danger/10 px-4 py-3 text-sm text-danger">
          {create.error instanceof Error
            ? create.error.message
            : "Failed to register property."}
        </div>
      ) : null}

      <Field label="Owner name" htmlFor="ownerName" error={errors.ownerName?.message} required>
        <Input {...register("ownerName")} autoComplete="name" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Ward" htmlFor="ward" error={errors.ward?.message} required>
          <Input type="number" min={1} max={35} {...register("ward")} />
        </Field>
        <Field label="Area (m²)" htmlFor="areaSqMeters" error={errors.areaSqMeters?.message} required>
          <Input type="number" step="any" min={0} {...register("areaSqMeters")} />
        </Field>
      </div>

      <Field label="Address" htmlFor="address" error={errors.address?.message} required>
        <Input {...register("address")} autoComplete="street-address" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tole (optional)" htmlFor="tole">
          <Input {...register("tole")} />
        </Field>
        <Field label="Property type" error={errors.propertyType?.message} required>
          <Select
            value={propertyType}
            onValueChange={(v) => v && setValue("propertyType", v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="agricultural">Agricultural</SelectItem>
              <SelectItem value="vacant_land">Vacant Land</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Land No." htmlFor="landOwnershipNumber" helper="If available">
          <Input {...register("landOwnershipNumber")} />
        </Field>
        <Field label="Floors" htmlFor="floorCount">
          <Input type="number" min={1} {...register("floorCount")} />
        </Field>
        <Field label="Age (yrs)" htmlFor="buildingAgeYears">
          <Input type="number" min={0} {...register("buildingAgeYears")} />
        </Field>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onDone()}
          disabled={create.isPending || pending}
        >
          Cancel
        </Button>
        <Button type="submit" loading={create.isPending || pending}>
          {create.isPending || pending ? "Submitting..." : "Submit for verification"}
        </Button>
      </div>
    </form>
  );
}
