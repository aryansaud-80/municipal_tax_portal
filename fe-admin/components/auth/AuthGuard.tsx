"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMe } from "@/features/auth/hooks";
import { isAuthenticated } from "@/lib/token-storage";

const PUBLIC_PATHS = ["/login"];

/**
 * Client-side route guard replacing the removed `proxy.ts` middleware
 * (middleware cannot run in `output: "export"` static sites).
 * Redirects unauthenticated visits to /login and keeps logged-in users
 * out of /login.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isLoading, isError } = useMe();

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isAuthenticated() && !isPublicPath) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    } else if (isAuthenticated() && pathname === "/login" && !isLoading && !isError && user) {
      router.replace("/dashboard");
    }
  }, [isPublicPath, pathname, router, isLoading, isError, user]);

  // Avoid flashing protected UI before the session check resolves.
  if (!isPublicPath && !isAuthenticated()) return null;

  return <>{children}</>;
}
