import { ShieldCheck } from "lucide-react";

export function SecurityInfo() {
  return (
    <div className="mt-6 flex items-start gap-2 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">
      <ShieldCheck
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-700"
        aria-hidden="true"
      />
      <p>
        This is a restricted government system. Access is limited to authorized
        personnel and all activity is logged and monitored.
      </p>
    </div>
  );
}
