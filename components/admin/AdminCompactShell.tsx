"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminCompactModeContext } from "@/contexts/AdminCompactModeContext";
import {
  ADMIN_COMPACT_MEDIA_QUERY,
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

  useLayoutEffect(() => {
    const mq = window.matchMedia(ADMIN_COMPACT_MEDIA_QUERY);
    setIsCompactAdmin(mq.matches);
    const onChange = () => setIsCompactAdmin(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
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
