"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMe } from "@/features/auth/hooks";
import { isAuthenticated } from "@/lib/token-storage";

const PUBLIC_PATHS = ["/login", "/register"];

/**
 * Client-side route guard replacing the removed `proxy.ts` middleware
 * (middleware cannot run in `output: "export"` static sites).
 * The landing page `/` stays public; all other non-auth routes require a
 * stored session.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isLoading, isError } = useMe();

  const isPublicPath =
    pathname === "/" || PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isAuthenticated() && !isPublicPath) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    } else if (
      isAuthenticated() &&
      (pathname === "/login" || pathname === "/register") &&
      !isLoading &&
      !isError &&
      user
    ) {
      router.replace("/dashboard");
    }
  }, [isPublicPath, pathname, router, isLoading, isError, user]);

  // Avoid flashing protected UI before the session check resolves.
  if (!isPublicPath && !isAuthenticated()) return null;

  return <>{children}</>;
}
