"use client";

import { useState, useMemo } from "react";
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon } from "lucide-react";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import type { Event } from "@/lib/types/graphql";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "@/hooks/use-translations";

interface DayData {
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: Event[];
}

export function WishlistCalendar() {
  const { savedEvents } = useWishlistStore();
  const { translateTarget } = useTranslations();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const getEventsForDate = (dateString: string) => {
    return savedEvents.filter((event) => {
      if (!event.term) return false;
      const eventDate = event.term.split("T")[0];
      return eventDate === dateString;
    });
  };

  // Generate calendar days
  const days = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];

    // Get the day of week (0-6, 0 = Sunday, need to convert to Monday first)
    let startDayOfWeek = firstDay.getDay();
    // Convert Sunday (0) to 7, then subtract 1 to make Monday = 0
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const daysArray: DayData[] = [];

    // Add previous month days
    const prevMonthLastDay = new Date(year, month, 0);
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay.getDate() - i);
      const dateString = date.toISOString().split("T")[0] || "";
      daysArray.push({
        date: dateString,
        isCurrentMonth: false,
        isToday: dateString === todayString,
        isSelected: dateString === selectedDate,
        events: getEventsForDate(dateString),
      });
    }

    // Add current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split("T")[0] || "";
      daysArray.push({
        date: dateString,
        isCurrentMonth: true,
        isToday: dateString === todayString,
        isSelected: dateString === selectedDate,
        events: getEventsForDate(dateString),
      });
    }

    // Add next month days to complete the grid (42 days = 6 rows)
    const remainingDays = 42 - daysArray.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dateString = date.toISOString().split("T")[0] || "";
      daysArray.push({
        date: dateString,
        isCurrentMonth: false,
        isToday: dateString === todayString,
        isSelected: dateString === selectedDate,
        events: getEventsForDate(dateString),
      });
    }

    return daysArray;
  }, [currentDate, selectedDate, savedEvents]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) {
      // Return all events with dates in chronological order
      return savedEvents
        .filter((e) => e.term)
        .sort((a, b) => {
          const dateA = new Date(a.term!).getTime();
          const dateB = new Date(b.term!).getTime();
          return dateA - dateB;
        })
        .slice(0, 3);
    }
    return getEventsForDate(selectedDate);
  }, [selectedDate, savedEvents]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date().toISOString().split("T")[0] || null);
  };

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "";
    return timeString;
  };

  return (
    <div className="lg:flex lg:h-full lg:flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4 lg:flex-none">
        <h1 className="text-base font-semibold text-foreground">
          <time dateTime={currentDate.toISOString().split("T")[0]}>{monthName}</time>
        </h1>
        <div className="flex items-center gap-4">
          <div className="relative flex items-center rounded-md bg-background shadow-sm border">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="flex h-9 w-12 items-center justify-center rounded-l-md pr-1 text-muted-foreground hover:text-foreground focus:relative md:w-9 md:pr-0 md:hover:bg-muted"
            >
              <span className="sr-only">Previous month</span>
              <ChevronLeftIcon aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="hidden px-3.5 text-sm font-semibold text-foreground hover:bg-muted focus:relative md:block"
            >
              Today
            </button>
            <span className="relative -mx-px h-5 w-px bg-border md:hidden" />
            <button
              type="button"
              onClick={goToNextMonth}
              className="flex h-9 w-12 items-center justify-center rounded-r-md pl-1 text-muted-foreground hover:text-foreground focus:relative md:w-9 md:pl-0 md:hover:bg-muted"
            >
              <span className="sr-only">Next month</span>
              <ChevronRightIcon aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="shadow-sm border lg:flex lg:flex-auto lg:flex-col">
        <div className="grid grid-cols-7 gap-px border-b bg-muted text-center text-xs/6 font-semibold text-muted-foreground lg:flex-none">
          <div className="flex justify-center bg-background py-2">
            <span>M</span>
            <span className="sr-only sm:not-sr-only">on</span>
          </div>
          <div className="flex justify-center bg-background py-2">
            <span>T</span>
            <span className="sr-only sm:not-sr-only">ue</span>
          </div>
          <div className="flex justify-center bg-background py-2">
            <span>W</span>
            <span className="sr-only sm:not-sr-only">ed</span>
          </div>
          <div className="flex justify-center bg-background py-2">
            <span>T</span>
            <span className="sr-only sm:not-sr-only">hu</span>
          </div>
          <div className="flex justify-center bg-background py-2">
            <span>F</span>
            <span className="sr-only sm:not-sr-only">ri</span>
          </div>
          <div className="flex justify-center bg-background py-2">
            <span>S</span>
            <span className="sr-only sm:not-sr-only">at</span>
          </div>
          <div className="flex justify-center bg-background py-2">
            <span>S</span>
            <span className="sr-only sm:not-sr-only">un</span>
          </div>
        </div>

        <div className="flex bg-muted text-xs/6 lg:flex-auto">
          <div className="hidden w-full lg:grid lg:grid-cols-7 lg:grid-rows-6 lg:gap-px">
            {days.map((day) => (
              <div
                key={day.date}
                className={`group relative px-3 py-2 ${
                  day.isCurrentMonth ? "bg-background" : "bg-muted/50"
                } ${day.events.length > 0 ? "cursor-pointer" : ""}`}
                onClick={() => day.events.length > 0 && day.date && setSelectedDate(day.date)}
              >
                <time
                  dateTime={day.date}
                  className={`relative ${!day.isCurrentMonth ? "opacity-50" : ""} ${
                    day.isToday
                      ? "flex size-6 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
                      : ""
                  }`}
                >
                  {day.date.split("-").pop()?.replace(/^0/, "")}
                </time>
                {day.events.length > 0 && (
                  <ol className="mt-2 space-y-1">
                    {day.events.slice(0, 2).map((event) => (
                      <li key={event.id}>
                        <Link href={`/${event.slug}`} className="group/event flex hover:underline">
                          <p className="flex-auto truncate font-medium text-foreground text-xs">
                            {event.name}
                          </p>
                          {event.start_time && (
                            <time className="ml-2 hidden flex-none text-muted-foreground xl:block text-xs">
                              {formatTime(event.start_time)}
                            </time>
                          )}
                        </Link>
                      </li>
                    ))}
                    {day.events.length > 2 && (
                      <li className="text-muted-foreground text-xs">+ {day.events.length - 2} more</li>
                    )}
                  </ol>
                )}
              </div>
            ))}
          </div>

          {/* Mobile view */}
          <div className="isolate grid w-full grid-cols-7 grid-rows-6 gap-px lg:hidden">
            {days.map((day) => (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelectedDate(day.date)}
                className={`group relative flex h-14 flex-col px-3 py-2 ${
                  !day.isCurrentMonth ? "bg-muted/50" : "bg-background"
                } ${
                  day.isSelected && day.isCurrentMonth ? "font-semibold text-primary-foreground" : ""
                } ${
                  !day.isSelected && !day.isCurrentMonth && !day.isToday ? "text-muted-foreground" : ""
                } ${!day.isSelected && day.isCurrentMonth && !day.isToday ? "text-foreground" : ""} ${
                  !day.isSelected && day.isToday ? "font-semibold text-primary" : ""
                } hover:bg-muted focus:z-10`}
              >
                <time
                  dateTime={day.date}
                  className={`ml-auto ${!day.isCurrentMonth ? "opacity-50" : ""} ${
                    day.isSelected
                      ? "flex size-6 items-center justify-center rounded-full bg-primary"
                      : ""
                  } ${day.isSelected && day.isToday ? "bg-primary" : ""} ${
                    day.isSelected && !day.isToday ? "bg-foreground" : ""
                  }`}
                >
                  {day.date.split("-").pop()?.replace(/^0/, "")}
                </time>
                <span className="sr-only">{day.events.length} events</span>
                {day.events.length > 0 && (
                  <span className="-mx-0.5 mt-auto flex flex-wrap-reverse">
                    {day.events.map((event) => (
                      <span key={event.id} className="mx-0.5 mb-1 size-1.5 rounded-full bg-muted-foreground" />
                    ))}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events list for mobile or selected day */}
      {selectedDayEvents.length > 0 && (
        <div className="px-4 py-10 sm:px-6 lg:hidden">
          <ol className="divide-y divide-border overflow-hidden rounded-lg bg-background text-sm shadow-sm border">
            {selectedDayEvents.map((event) => (
              <li key={event.id} className="group flex p-4 pr-6 focus-within:bg-muted hover:bg-muted">
                <div className="flex-auto">
                  <p className="font-semibold text-foreground">{event.name}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {event.start_time && (
                      <time className="flex items-center text-muted-foreground">
                        <ClockIcon aria-hidden="true" className="mr-2 size-5" />
                        {formatTime(event.start_time)}
                      </time>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {event.targets?.slice(0, 2).map((target) => (
                      <Badge key={target.id} variant="outline" className="text-xs">
                        {translateTarget(target.name)}
                      </Badge>
                    ))}
                  </div>
                </div>
                {event.slug && (
                  <Link
                    href={`/${event.slug}`}
                    className="ml-6 flex-none self-center rounded-md bg-background px-3 py-2 font-semibold text-foreground opacity-0 shadow-sm border group-hover:opacity-100 hover:bg-muted focus:opacity-100"
                  >
                    View<span className="sr-only">, {event.name}</span>
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {savedEvents.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">
            No events saved yet. Star events to add them to your wishlist!
          </p>
        </div>
      )}
    </div>
  );
}
