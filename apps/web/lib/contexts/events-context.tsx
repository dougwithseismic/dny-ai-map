"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { EventsQueryVariables } from "@/lib/types/graphql";
import {
  searchParamsToFilters,
  createUrlWithFilters,
} from "@/lib/utils/url-params";

interface EventsContextValue {
  filters: EventsQueryVariables;
  setFilters: React.Dispatch<React.SetStateAction<EventsQueryVariables>>;
  updateFilters: (newFilters: Partial<EventsQueryVariables>) => void;
  clearFilters: () => void;
}

const EventsContext = React.createContext<EventsContextValue | null>(null);

export function useEventsFilters() {
  const context = React.useContext(EventsContext);
  if (!context) {
    throw new Error("useEventsFilters must be used within EventsProvider");
  }
  return context;
}

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize filters from URL on mount
  const [filters, setFilters] = React.useState<EventsQueryVariables>(() => {
    return searchParamsToFilters(searchParams);
  });

  // Sync URL when filters change
  React.useEffect(() => {
    const newUrl = createUrlWithFilters(pathname, filters);
    router.replace(newUrl, { scroll: false });
  }, [filters, pathname, router]);

  const updateFilters = React.useCallback(
    (newFilters: Partial<EventsQueryVariables>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const clearFilters = React.useCallback(() => {
    setFilters({});
  }, []);

  const value = React.useMemo(
    () => ({
      filters,
      setFilters,
      updateFilters,
      clearFilters,
    }),
    [filters, updateFilters, clearFilters]
  );

  return (
    <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
  );
}
