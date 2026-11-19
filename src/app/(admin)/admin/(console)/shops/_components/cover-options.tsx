"use client";

import { createContext, useContext } from "react";

import type { CoverOption } from "@/lib/queries/covers";

// The cover library's active covers (sql/017), read once by the page and
// offered under every shop's cover.
const CoverOptionsContext = createContext<CoverOption[]>([]);

export function CoverOptionsProvider({ covers, children }: { covers: CoverOption[]; children: React.ReactNode }) {
  return <CoverOptionsContext.Provider value={covers}>{children}</CoverOptionsContext.Provider>;
}

export function useCoverOptions() {
  return useContext(CoverOptionsContext);
}
