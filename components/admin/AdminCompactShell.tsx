"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isMobile, isTablet } from "react-device-detect";
import { AdminCompactModeContext } from "@/contexts/AdminCompactModeContext";
import {
  compactAdminRedirectTarget,
  isAllowedCompactAdminPath,
} from "@/lib/adminMobileAccess";

export default function AdminCompactShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCompactAdmin, setIsCompactAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    // Device type should be stable for the session; do not react to viewport resize.
    setIsCompactAdmin(isMobile || isTablet);
  }, []);

  useEffect(() => {
    if (!isCompactAdmin) {
      prevPathnameRef.current = pathname;
      return;
    }

    const prev = prevPathnameRef.current;
    const pathChanged = prev !== pathname;

    if (isAllowedCompactAdminPath(pathname)) {
      prevPathnameRef.current = pathname;
      return;
    }

    prevPathnameRef.current = pathname;

    // Only redirect when the route actually changed. Otherwise a matchMedia flip
    // (window restore, devtools, focus reflow) can yank the user back to check-in.
    if (!pathChanged) return;

    const next = compactAdminRedirectTarget(pathname);
    if (next !== pathname) {
      router.replace(next);
    }
  }, [isCompactAdmin, pathname, router]);

  const value = useMemo(() => ({ isCompactAdmin }), [isCompactAdmin]);

  return (
    <AdminCompactModeContext.Provider value={value}>
      {children}
    </AdminCompactModeContext.Provider>
  );
}
