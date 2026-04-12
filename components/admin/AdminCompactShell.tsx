"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
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

  useLayoutEffect(() => {
    const mq = window.matchMedia(ADMIN_COMPACT_MEDIA_QUERY);
    setIsCompactAdmin(mq.matches);
    const onChange = () => setIsCompactAdmin(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!isCompactAdmin) return;
    if (isAllowedCompactAdminPath(pathname)) return;
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
