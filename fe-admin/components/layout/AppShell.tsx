"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  User,
  Building2,
  ClipboardCheck,
  ReceiptText,
  Wallet,
  FileText,
  Tags,
  Settings2,
  BarChart3,
  ShieldCheck,
  ScrollText,
  LogOut,
  Menu,
  Landmark,
  X,
  Search,
  Sun,
  Moon,
  Monitor,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMe, useLogout } from "@/features/auth/hooks";
import { usePrefs, setPrefs, type Calendar, type Language, type ThemeMode } from "@/lib/display-prefs";
import { useStrings } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CommandPalette, type PalettePage } from "./CommandPalette";

const NAV = [
  { href: "/dashboard", labelKey: "navDashboard", icon: LayoutDashboard, perm: "dashboard.view" },
  { href: "/users", labelKey: "navUsers", icon: Users, perm: "user.view" },
  { href: "/verification", labelKey: "navVerification", icon: ClipboardCheck, perm: "propertyApplication.view" },
  { href: "/properties", labelKey: "navProperties", icon: Building2, perm: "propertyTax.view" },
  { href: "/tax-rules", labelKey: "navTaxRules", icon: Settings2, perm: "taxRule.view" },
  { href: "/taxes", labelKey: "navAssessments", icon: ReceiptText, perm: "propertyTax.view" },
  { href: "/bills", labelKey: "navBills", icon: ReceiptText, perm: "bill.view" },
  { href: "/payments", labelKey: "navPayments", icon: Wallet, perm: "payment.view" },
  { href: "/receipts", labelKey: "navReceipts", icon: FileText, perm: "receipt.view" },
  { href: "/categories", labelKey: "navCategories", icon: Tags, perm: "propertyTax.view" },
  { href: "/reports", labelKey: "navReports", icon: BarChart3, perm: "report.view" },
  { href: "/employees", labelKey: "navEmployees", icon: ShieldCheck, perm: "user.view" },
  { href: "/audit", labelKey: "navAudit", icon: ScrollText, perm: "auditLog.view" },
] as const;

const COLLAPSE_KEY = "mtp-admin-sidebar-collapsed";

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center rounded-[10px] border bg-surface p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            "rounded-lg px-2 py-1 text-xs font-medium transition-colors duration-150",
            value === o.value
              ? "bg-primary-soft text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const s = useStrings();
  const prefs = usePrefs();
  const [collapsed, setCollapsed] = useState<boolean>(() => readCollapsed());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteKey, setPaletteKey] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const { data: user } = useMe();
  const logout = useLogout();

  const openPalette = () => {
    setPaletteKey((k) => k + 1);
    setPaletteOpen(true);
  };

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !c;
    });
  };

  // Show/hide nav items from the user's existing permissions (read-only).
  const granted = user?.permissions;
  const visibleNav = NAV.filter((n) => !granted || granted.includes(n.perm));

  const pages: PalettePage[] = visibleNav.map((n) => ({
    href: n.href,
    label: s[n.labelKey],
  }));

  const go = (href: string) => {
    setDrawerOpen(false);
    router.push(href);
  };

  const cycleTheme = () => {
    const next: ThemeMode =
      prefs.theme === "light" ? "dark" : prefs.theme === "dark" ? "system" : "light";
    setPrefs({ theme: next });
  };

  const ThemeIcon = prefs.theme === "dark" ? Moon : prefs.theme === "light" ? Sun : Monitor;

  const sidebarBody = (isDrawer: boolean, isCollapsed: boolean) => (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 items-center gap-2.5 border-b px-4", isCollapsed && !isDrawer && "justify-center px-0")}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
          <Landmark className="h-5 w-5" aria-hidden />
        </div>
        {isCollapsed && !isDrawer ? null : (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">{s.appName}</p>
            <p className="truncate text-xs text-muted-foreground">{s.portalName}</p>
          </div>
        )}
        {isDrawer ? (
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label={s.closeMenu}
            className="ml-auto rounded-[10px] p-2 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
      </div>

      <nav aria-label={s.portalName} className="flex-1 overflow-y-auto px-3 py-4 scrollbar-slim">
        <ul className="space-y-1">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const label = s[item.labelKey];
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <button
                  onClick={() => go(item.href)}
                  aria-current={active ? "page" : undefined}
                  title={isCollapsed && !isDrawer ? label : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                    isCollapsed && !isDrawer && "justify-center px-0",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-primary-soft hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                  {isCollapsed && !isDrawer ? null : <span className="truncate">{label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t p-3">
        {!isCollapsed || isDrawer ? (
          <div className="mb-2 flex items-center gap-3 rounded-[10px] px-2 py-1.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary">
              {user?.firstName?.charAt(0) ?? "A"}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium">
                {user ? `${user.firstName} ${user.lastName}` : "…"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</p>
            </div>
          </div>
        ) : null}
        <button
          onClick={() => logout.mutate()}
          title={isCollapsed && !isDrawer ? s.logout : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground",
            isCollapsed && !isDrawer && "justify-center px-0",
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden />
          {isCollapsed && !isDrawer ? null : <span>{s.logout}</span>}
        </button>
      </div>
    </div>
  );

  const crumbs = (() => {
    const match = visibleNav.find(
      (n) => pathname === n.href || pathname.startsWith(n.href + "/"),
    );
    return match ? s[match.labelKey] : "";
  })();

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      {/* Desktop sidebar — fixed height, never scrolls with content */}
      <aside
        className={cn(
          "hidden h-dvh shrink-0 border-r bg-surface transition-[width] duration-200 ease-out lg:block",
          collapsed ? "w-[72px]" : "w-[264px]",
        )}
      >
        {sidebarBody(false, collapsed)}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={s.portalName}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-surface shadow-xl animate-page-in">
            {sidebarBody(true, false)}
          </aside>
        </div>
      ) : null}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main
          onScroll={(e) => setScrolled((e.target as HTMLElement).scrollTop > 4)}
          className="min-h-0 flex-1 overflow-y-auto scroll-smooth overscroll-contain scrollbar-slim"
          style={{ scrollbarGutter: "stable" }}
        >
          {/* Sticky topbar */}
          <header
            className={cn(
              "sticky top-0 z-30 border-b bg-background/85 backdrop-blur transition-colors duration-150",
              scrolled ? "border-border" : "border-transparent",
            )}
          >
            <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center gap-2 px-4 md:px-6 lg:px-8">
              <button
                className="rounded-[10px] p-2.5 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground lg:hidden"
                onClick={() => setDrawerOpen(true)}
                aria-label={s.openMenu}
              >
                <Menu className="h-5 w-5" aria-hidden />
              </button>
              <button
                className="hidden rounded-[10px] p-2.5 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground lg:block"
                onClick={toggleCollapsed}
                aria-label={collapsed ? s.expandSidebar : s.collapseSidebar}
              >
                {collapsed ? (
                  <ChevronRight className="h-5 w-5" aria-hidden />
                ) : (
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                )}
              </button>

              <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm sm:flex">
                <span className="shrink-0 text-muted-foreground">{s.breadcrumbHome}</span>
                {crumbs ? (
                  <>
                    <span className="text-muted-foreground" aria-hidden>/</span>
                    <span aria-current="page" className="truncate font-medium">{crumbs}</span>
                  </>
                ) : null}
              </nav>

              <div className="flex-1" />

              <button
                onClick={openPalette}
                className="hidden h-10 items-center gap-2 rounded-[10px] border bg-surface px-3 text-sm text-muted-foreground transition-colors duration-150 hover:border-primary/40 hover:text-foreground md:flex md:w-48 lg:w-56"
              >
                <Search className="h-[18px] w-[18px]" aria-hidden />
                <span className="truncate">{s.searchPlaceholder}</span>
              </button>
              <button
                onClick={openPalette}
                aria-label={s.search}
                className="rounded-[10px] p-2.5 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground md:hidden"
              >
                <Search className="h-5 w-5" aria-hidden />
              </button>

              <div className="hidden items-center gap-2 xl:flex">
                <Segmented<Language>
                  label={s.language}
                  value={prefs.language}
                  onChange={(v) => setPrefs({ language: v })}
                  options={[
                    { value: "en", label: "EN" },
                    { value: "ne", label: "ने" },
                  ]}
                />
                <Segmented<Calendar>
                  label={s.calendar}
                  value={prefs.calendar}
                  onChange={(v) => setPrefs({ calendar: v })}
                  options={[
                    { value: "AD", label: "AD" },
                    { value: "BS", label: "BS" },
                  ]}
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={cycleTheme}
                aria-label={`${s.theme}: ${prefs.theme}`}
                title={`${s.theme}: ${prefs.theme}`}
              >
                <ThemeIcon className="h-5 w-5" aria-hidden />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={s.account}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary outline-none transition-colors duration-150 hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {user?.firstName?.charAt(0) ?? "A"}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="w-56">
                  <DropdownMenuLabel>
                    <span className="block truncate text-sm font-medium">
                      {user ? `${user.firstName} ${user.lastName}` : ""}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{user?.email ?? ""}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User className="h-4 w-4" aria-hidden /> {s.navProfile}
                  </DropdownMenuItem>
                  <div className="flex items-center justify-between px-1.5 py-1 xl:hidden">
                    <Segmented<Language>
                      label={s.language}
                      value={prefs.language}
                      onChange={(v) => setPrefs({ language: v })}
                      options={[
                        { value: "en", label: "EN" },
                        { value: "ne", label: "ने" },
                      ]}
                    />
                    <Segmented<Calendar>
                      label={s.calendar}
                      value={prefs.calendar}
                      onChange={(v) => setPrefs({ calendar: v })}
                      options={[
                        { value: "AD", label: "AD" },
                        { value: "BS", label: "BS" },
                      ]}
                    />
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => logout.mutate()}>
                    <LogOut className="h-4 w-4" aria-hidden /> {s.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Key includes display prefs so BS/AD + language toggles repaint
              formatted dates/currency (children elements bail out otherwise). */}
          <div
            key={`${pathname}-${prefs.language}-${prefs.calendar}`}
            className="mx-auto w-full max-w-[1280px] animate-page-in px-4 py-6 md:px-6 lg:px-8"
          >
            {children}
          </div>
        </main>
      </div>

      <CommandPalette key={paletteKey} open={paletteOpen} onOpenChange={setPaletteOpen} pages={pages} />
    </div>
  );
}
