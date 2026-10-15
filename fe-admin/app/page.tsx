"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Static export has no server `redirect()`; navigate client-side instead.
export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return null;
}
