import { ShieldCheck } from "lucide-react";

export function SecurityInfo() {
  return (
    <div className="mt-6 flex items-start gap-2 rounded-[10px] bg-muted px-4 py-3 text-xs text-muted-foreground">
      <ShieldCheck
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
        aria-hidden="true"
      />
      <p>
        This is a restricted government system. Access is limited to authorized
        personnel and all activity is logged and monitored.
      </p>
    </div>
  );
}
