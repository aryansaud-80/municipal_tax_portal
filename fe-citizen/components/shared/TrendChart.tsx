"use client";

import { useId } from "react";

/** Dependency-free SVG charts (no chart library). */

function points(data: number[], width: number, height: number, pad = 3): string {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  return data
    .map((v, i) => {
      const x = pad + (i / Math.max(data.length - 1, 1)) * (width - pad * 2);
      const y = height - pad - ((v - min) / span) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function Sparkline({
  data,
  width = 120,
  height = 32,
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}) {
  const id = useId();
  if (data.length < 2) return null;
  const line = points(data, width, height);
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`3,${height - 3} ${line} ${width - 3},${height - 3}`} fill={`url(#${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrendChart({
  data,
  height = 220,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const id = useId();
  if (data.length === 0) return null;
  const W = 560;
  const H = 200;
  const padL = 8;
  const padB = 26;
  const values = data.map((d) => d.value);
  const line = points(values, W, H - padB, padL);
  const max = Math.max(...values, 0);
  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        height={height}
        role="img"
        aria-label="Collection trend chart"
        className="w-full"
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={padL}
            x2={W - padL}
            y1={H * f}
            y2={H * f}
            stroke="var(--border)"
            strokeWidth="1"
          />
        ))}
        <polygon
          points={`${padL},${H - padB} ${line} ${W - padL},${H - padB}`}
          fill={`url(#${id})`}
        />
        <polyline
          points={line}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {values.map((v, i) => {
          const x = padL + (i / Math.max(values.length - 1, 1)) * (W - padL * 2);
          const span = max || 1;
          const y = H - padB - 3 - (v / span) * (H - padB - 6);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="3" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2">
                <title>{`${data[i].label}: ${v.toLocaleString()}`}</title>
              </circle>
              <text x={x} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">
                {data[i].label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
