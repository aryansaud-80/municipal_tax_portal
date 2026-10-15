"use client";

import { useSyncExternalStore } from "react";

export type ThemeMode = "system" | "light" | "dark";
export type Language = "en" | "ne";
export type Calendar = "AD" | "BS";

export interface DisplayPrefs {
  theme: ThemeMode;
  language: Language;
  calendar: Calendar;
}

const STORAGE_KEY = "mtp-prefs-v1";

const defaults: DisplayPrefs = { theme: "system", language: "en", calendar: "AD" };

function load(): DisplayPrefs {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<DisplayPrefs>;
    return {
      theme: parsed.theme === "light" || parsed.theme === "dark" ? parsed.theme : "system",
      language: parsed.language === "ne" ? "ne" : "en",
      calendar: parsed.calendar === "BS" ? "BS" : "AD",
    };
  } catch {
    return defaults;
  }
}

let state: DisplayPrefs = defaults;
let hydrated = false;
const listeners = new Set<() => void>();

function ensureHydrated() {
  if (!hydrated) {
    hydrated = true;
    state = load();
  }
}

export function resolvedTheme(): "light" | "dark" {
  ensureHydrated();
  if (state.theme !== "system") return state.theme;
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

export function applyThemeDom() {
  if (typeof document === "undefined") return;
  const dark = resolvedTheme() === "dark";
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

function emit() {
  for (const fn of listeners) fn();
}

export function getPrefs(): DisplayPrefs {
  ensureHydrated();
  return state;
}

export function setPrefs(patch: Partial<DisplayPrefs>) {
  ensureHydrated();
  state = { ...state, ...patch };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — keep in-memory prefs */
  }
  applyThemeDom();
  emit();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function usePrefs(): DisplayPrefs {
  return useSyncExternalStore(subscribe, getPrefs, () => defaults);
}

export const THEME_INIT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem('${STORAGE_KEY}')||'{}');var t=p.theme||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
