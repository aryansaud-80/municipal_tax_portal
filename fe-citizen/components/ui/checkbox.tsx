"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border border-border bg-surface transition-colors duration-150 outline-none hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground data-disabled:cursor-not-allowed data-disabled:opacity-50 [&_svg]:size-3.5",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator render={<CheckIcon aria-hidden />}>
        <CheckIcon aria-hidden />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
