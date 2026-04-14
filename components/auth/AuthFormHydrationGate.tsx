"use client";

import { useEffect, useState } from "react";

/**
 * Renders `skeleton` on server + first client paint, then `children` after mount.
 * Avoids React hydration errors when password-manager extensions (e.g. LastPass)
 * inject nodes into <input> wrappers before hydration completes.
 */
export function AuthFormHydrationGate({
  children,
  skeleton,
}: {
  children: React.ReactNode;
  skeleton: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready ? children : skeleton;
}
