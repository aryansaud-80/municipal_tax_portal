import NepaliDate from "nepali-date-converter";
import { getPrefs } from "./display-prefs";

const DEVANAGARI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function toDevanagariDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => DEVANAGARI_DIGITS[Number(d)]);
}

export function formatCurrency(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  const { language } = getPrefs();
  // Explicit रु + Devanagari digits: deterministic regardless of ICU data.
  if (language === "ne") {
    const grouped = new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(num);
    return `रु ${toDevanagariDigits(grouped)}`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(num);
}

function toBSDate(value: string | Date): string | null {
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    const { language } = getPrefs();
    const np = new NepaliDate(d);
    return language === "ne"
      ? `${np.format("DD/MM/YYYY", "np")} बि.सं.`
      : `${np.format("YYYY-MM-DD")} BS`;
  } catch {
    return null;
  }
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const { calendar } = getPrefs();
  if (calendar === "BS") {
    return toBSDate(value) ?? fallbackDate(value);
  }
  return fallbackDate(value);
}

function fallbackDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const { calendar } = getPrefs();
  if (calendar === "BS") {
    const bs = toBSDate(value);
    const time = new Date(value).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (bs) return `${bs}, ${time}`;
  }
  return new Date(value).toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function titleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
