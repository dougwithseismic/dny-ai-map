"use client";

import * as React from "react";
import { DatePicker } from "@/components/date-picker";
import { EventFilters } from "@/components/events/event-filters";
import { Sponsor } from "@/components/sponsor";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  useCities,
  useEventTargets,
  useEventFormats,
  useEvents,
  useFilteredEvents,
} from "@/lib/graphql/hooks";
import { useEventsFilters } from "@/lib/contexts/events-context";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { filters, updateFilters, clearFilters } = useEventsFilters();

  const [citiesResult] = useCities();
  const [targetsResult] = useEventTargets();
  const [formatsResult] = useEventFormats();
  const [eventsResult] = useEvents({});
  const [filteredEventsResult] = useFilteredEvents(filters);

  const { data: citiesData, fetching: citiesLoading } = citiesResult;
  const { data: targetsData, fetching: targetsLoading } = targetsResult;
  const { data: formatsData, fetching: formatsLoading } = formatsResult;
  const { data: eventsData } = eventsResult;
  const { data: filteredEventsData } = filteredEventsResult;

  const cities = citiesData?.cities || [];
  const targets = targetsData?.eventTargets || [];
  const formats = formatsData?.eventFormats || [];
  const events = eventsData?.events || [];
  const filteredEvents = filteredEventsData?.events || [];

  // Extract unique languages from all events
  const allLanguages = React.useMemo(() => {
    const languageSet = new Set<string>();
    events.forEach((event) => {
      event.languages?.forEach((lang) => {
        if (lang) languageSet.add(lang);
      });
    });
    return Array.from(languageSet).sort();
  }, [events]);

  // Calculate min/max dates from events
  const { minDate, maxDate } = React.useMemo(() => {
    if (events.length === 0) return { minDate: undefined, maxDate: undefined };

    const dates = events
      .map((event) => event.term)
      .filter((term): term is string => term !== null && term !== undefined)
      .map((term) => new Date(term));

    if (dates.length === 0) return { minDate: undefined, maxDate: undefined };

    return {
      minDate: new Date(Math.min(...dates.map((d) => d.getTime()))),
      maxDate: new Date(Math.max(...dates.map((d) => d.getTime()))),
    };
  }, [events]);

  const filterDataLoading = citiesLoading || targetsLoading || formatsLoading;

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-sidebar-border border-b p-4">
        <h2 className="text-lg font-semibold">Filter Events</h2>
      </SidebarHeader>
      <SidebarContent className="px-4">
        <DatePicker minDate={minDate} maxDate={maxDate} />
        <SidebarSeparator className="mx-0" />
        <Sponsor />
        <SidebarSeparator className="mx-0" />
        <EventFilters
          cities={cities}
          targets={targets}
          formats={formats}
          allLanguages={allLanguages}
          filters={filters}
          onFilterChange={updateFilters}
          onClearFilters={clearFilters}
          loading={filterDataLoading}
          eventCount={filteredEvents.length}
          totalEvents={events.length}
          filteredEvents={filteredEvents}
        />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
