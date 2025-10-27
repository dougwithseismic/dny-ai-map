"use client";

import { useQuery } from "urql";
import { useMemo } from "react";
import type {
  EventsQueryVariables,
  EventsQuery,
  CitiesQuery,
  EventTargetsQuery,
  EventFormatsQuery,
  EventBySlugQuery,
  EventBySlugQueryVariables,
} from "../types/graphql";
import {
  EVENTS_QUERY,
  CITIES_QUERY,
  EVENT_TARGETS_QUERY,
  EVENT_FORMATS_QUERY,
  EVENT_BY_SLUG_QUERY,
} from "./queries";

export function useEvents(variables?: EventsQueryVariables) {
  return useQuery<EventsQuery, EventsQueryVariables>({
    query: EVENTS_QUERY,
    variables: variables || {},
    requestPolicy: "cache-first",
  });
}

/**
 * Hook that applies client-side filtering for languages, targets, and price.
 * Backend doesn't support filtering by these fields, so we filter on the client.
 */
export function useFilteredEvents(variables?: EventsQueryVariables) {
  // Separate backend-supported filters from client-side filters
  const backendVariables = useMemo(() => {
    if (!variables) return {};

    const { languages, targets, priceFilter, ...rest } = variables;
    // Remove targets and priceFilter from backend query since it doesn't actually filter
    return rest;
  }, [variables]);

  // Fetch events using only backend-supported filters
  const [result] = useQuery<EventsQuery, EventsQueryVariables>({
    query: EVENTS_QUERY,
    variables: backendVariables,
    requestPolicy: "cache-first",
  });

  // Apply client-side filtering for languages and targets
  const filteredData = useMemo(() => {
    if (!result.data?.events) return result.data;

    let filtered = result.data.events;

    // Filter by languages
    if (variables?.languages && variables.languages.length > 0) {
      filtered = filtered.filter((event) =>
        event.languages?.some((lang) => variables.languages!.includes(lang))
      );
    }

    // Filter by targets
    if (variables?.targets && variables.targets.length > 0) {
      filtered = filtered.filter((event) =>
        event.targets?.some((target) => variables.targets!.includes(target.id))
      );
    }

    // Filter by price
    if (variables?.priceFilter) {
      if (variables.priceFilter === "free") {
        filtered = filtered.filter((event) => event.price === 0);
      } else if (variables.priceFilter === "paid") {
        filtered = filtered.filter((event) => event.price !== null && event.price > 0);
      }
      // "all" means no filtering, so we don't need a condition for it
    }

    return { ...result.data, events: filtered };
  }, [result.data, variables?.languages, variables?.targets, variables?.priceFilter]);

  return [{ ...result, data: filteredData }] as const;
}

export function useCities() {
  return useQuery<CitiesQuery>({
    query: CITIES_QUERY,
    requestPolicy: "cache-first",
  });
}

export function useEventTargets() {
  return useQuery<EventTargetsQuery>({
    query: EVENT_TARGETS_QUERY,
    requestPolicy: "cache-first",
  });
}

export function useEventFormats() {
  return useQuery<EventFormatsQuery>({
    query: EVENT_FORMATS_QUERY,
    requestPolicy: "cache-first",
  });
}

export function useEventBySlug(slug: string) {
  return useQuery<EventBySlugQuery, EventBySlugQueryVariables>({
    query: EVENT_BY_SLUG_QUERY,
    variables: { slug },
    pause: !slug,
  });
}
