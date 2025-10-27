"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { useEventsFilters } from "@/lib/contexts/events-context";
import type { DateRange } from "react-day-picker";

interface DatePickerProps {
  minDate?: Date;
  maxDate?: Date;
}

export function DatePicker({ minDate, maxDate }: DatePickerProps) {
  const { filters, updateFilters } = useEventsFilters();
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();

  const handleSelect = (range: DateRange | undefined) => {
    setDateRange(range);

    // Convert date range to array of date strings for the filter
    if (range?.from) {
      const dates: string[] = [];
      const current = new Date(range.from);
      const end = new Date(range.to || range.from);

      // Add one day to end to make comparison exclusive (but include the end date)
      end.setDate(end.getDate() + 1);

      while (current < end) {
        const dateString = current.toISOString().split("T")[0];
        if (dateString) dates.push(dateString);
        current.setDate(current.getDate() + 1);
      }

      updateFilters({ dates: dates.length > 0 ? dates : undefined });
    } else {
      updateFilters({ dates: undefined });
    }
  };

  return (
    <SidebarGroup className="px-0">
      <SidebarGroupContent className="flex items-center justify-center">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={handleSelect}
          month={new Date(2025, 10, 1)}
          fromDate={minDate}
          toDate={maxDate}
          disabled={
            minDate && maxDate
              ? { before: minDate, after: maxDate }
              : undefined
          }
          className="[&_.rdp-nav]:hidden [&_[role=gridcell].bg-accent]:bg-sidebar-primary [&_[role=gridcell].bg-accent]:text-sidebar-primary-foreground"
        />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
