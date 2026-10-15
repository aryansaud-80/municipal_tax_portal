"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border border-transparent bg-muted transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-checked:bg-primary data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-surface shadow-sm transition-transform duration-150 data-checked:translate-x-[22px]" />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
