"use client";

import NepaliDate from "nepali-date-converter";
import { CalendarDays } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { usePrefs } from "@/lib/display-prefs";

/**
 * BS-aware date control. Stores an ISO (AD) date string; always shows the
 * live Bikram Sambat equivalent underneath — never a hand approximation.
 */
export function DatePicker({
  id,
  label,
  value,
  onChange,
  helper,
  error,
  required,
  min,
  max,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
  helper?: string;
  error?: string;
  required?: boolean;
  min?: string;
  max?: string;
}) {
  const { language } = usePrefs();
  let bsPreview: string | null = null;
  try {
    if (value) {
      const d = new Date(`${value}T00:00:00`);
      if (!Number.isNaN(d.getTime())) {
        const np = new NepaliDate(d);
        bsPreview =
          language === "ne"
            ? `${np.format("DD MMMM YYYY", "np")} बि.सं.`
            : `${np.format("DD MMMM YYYY")} BS`;
      }
    }
  } catch {
    bsPreview = null;
  }

  return (
    <Field label={label} htmlFor={id} helper={helper} error={error} required={required}>
      <Input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
      />
      {bsPreview ? (
        <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground tnum" aria-live="polite">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          {bsPreview}
        </p>
      ) : null}
    </Field>
  );
}
