import { Landmark } from "lucide-react";

export function LoginIllustration() {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-primary px-12 py-14 text-primary-foreground">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
          <Landmark className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-base font-semibold leading-tight">
            Municipal Tax Portal
          </p>
          <p className="text-sm opacity-80">Admin Portal</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center py-12">
        {/* Simple, government-appropriate line illustration — no stock/flashy imagery */}
        <svg
          viewBox="0 0 320 220"
          className="w-full max-w-sm opacity-80"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="40"
            y="90"
            width="240"
            height="110"
            rx="4"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.5"
          />
          <rect
            x="60"
            y="60"
            width="200"
            height="30"
            rx="3"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.6"
          />
          <line
            x1="20"
            y1="200"
            x2="300"
            y2="200"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.4"
          />
          {[75, 115, 155, 195, 235].map((x) => (
            <rect
              key={x}
              x={x}
              y="110"
              width="12"
              height="80"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.5"
            />
          ))}
          <polygon
            points="160,20 240,60 80,60"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.6"
          />
          <rect
            x="150"
            y="150"
            width="20"
            height="50"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.6"
          />
        </svg>
      </div>

      <div>
        <p className="text-lg font-medium leading-snug text-white">
          Transparent Revenue Management for Better Governance
        </p>
        <p className="mt-6 text-xs opacity-70">
          © {new Date().getFullYear()} Municipal Tax Portal. All rights
          reserved.
        </p>
      </div>
    </div>
  );
}
