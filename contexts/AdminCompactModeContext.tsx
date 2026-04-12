"use client";

import { createContext, useContext } from "react";

export interface AdminCompactModeContextValue {
  isCompactAdmin: boolean;
}

export const AdminCompactModeContext = createContext<AdminCompactModeContextValue>({
  isCompactAdmin: false,
});

export function useAdminCompactMode(): AdminCompactModeContextValue {
  return useContext(AdminCompactModeContext);
}
