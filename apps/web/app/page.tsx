"use client";

import { useState, useEffect } from "react";
import { useFilteredEvents } from "@/lib/graphql/hooks";
import { EventCard } from "@/components/events/event-card";
import { EventsMap } from "@/components/events/events-map";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventsFilters } from "@/lib/contexts/events-context";
import { Map, List } from "lucide-react";
import { generateEventsListSchema, JsonLdScript } from "@/lib/seo/json-ld";

type ViewMode = "list" | "map";

export default function Home() {
  const { filters, clearFilters } = useEventsFilters();
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [viewMode, setViewMode] = useState<ViewMode>("map");

  // Debounce filter changes to prevent spamming GraphQL
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);

    return () => clearTimeout(timeout);
  }, [filters]);

  const [eventsResult] = useFilteredEvents(debouncedFilters);

  const {
    data: eventsData,
    fetching: eventsLoading,
    error: eventsError,
  } = eventsResult;

  const events = eventsData?.events || [];

  // Generate ItemList schema for events
  const eventsListSchema = events.length > 0 ? generateEventsListSchema(events) : null;

  return (
    <>
      {eventsListSchema && <JsonLdScript data={eventsListSchema} />}
      <div className="flex flex-col w-full flex-1 overflow-hidden">
      {/* View Toggle */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold">dny.ai meet schedule</h1>
        <div className="inline-flex rounded-lg border p-1 bg-muted">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="gap-2"
          >
            <List className="size-4" />
            List
          </Button>
          <Button
            variant={viewMode === "map" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("map")}
            className="gap-2"
          >
            <Map className="size-4" />
            Map
          </Button>
        </div>
      </div>

      {eventsError && (
        <Card className="border-destructive bg-destructive/10 text-destructive p-4 mb-4 flex-shrink-0">
          <p>Error loading events: {eventsError.message}</p>
        </Card>
      )}

      {eventsLoading && (
        <div className="space-y-6 flex-1 overflow-y-auto">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}
        </div>
      )}

      {!eventsLoading && events.length === 0 && (
        <Card className="text-center py-20 flex-shrink-0">
          <p className="text-muted-foreground text-lg mb-4">
            No events found matching your criteria.
          </p>
          <Button onClick={clearFilters} variant="outline">
            Clear filters
          </Button>
        </Card>
      )}

      {!eventsLoading && events.length > 0 && (
        <div className="flex-1 overflow-hidden">
          {viewMode === "list" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto h-full">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <EventsMap events={events} />
          )}
        </div>
      )}
      </div>
    </>
  );
}
