"use client";

import type { City, EventTarget, EventFormat, EventsQueryVariables, Event } from "@/lib/types/graphql";
import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { XIcon, FileText, Braces } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";
import { getUniqueLanguages } from "@/lib/translations/czech-to-english";
import { formatEventsAsMarkdown, formatEventsAsJSON } from "@/lib/utils/export-events";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

interface EventFiltersProps {
  cities: City[];
  targets: (EventTarget | null)[];
  formats: (EventFormat | null)[];
  allLanguages: string[];
  filters: EventsQueryVariables;
  onFilterChange: (filters: Partial<EventsQueryVariables>) => void;
  onClearFilters: () => void;
  loading?: boolean;
  eventCount?: number;
  totalEvents?: number;
  filteredEvents?: Event[];
}

export function EventFilters({
  cities,
  targets,
  formats,
  allLanguages,
  filters,
  onFilterChange,
  onClearFilters,
  loading,
  eventCount,
  totalEvents,
  filteredEvents = [],
}: EventFiltersProps) {
  const { translateLanguage, translateTarget, translateFormat, translateCity } = useTranslations();
  const { copyToClipboard } = useCopyToClipboard();

  // Convert cities to multi-select options (translate label, keep ID for API)
  const cityOptions: MultiSelectOption[] = useMemo(
    () => cities.map((city) => ({ label: translateCity(city.name), value: city.id })),
    [cities, translateCity]
  );

  // Merge language variants - show one option per unique language (e.g., just "English")
  // but store all Czech variants as value
  const languageOptions: MultiSelectOption[] = useMemo(() => {
    const uniqueLanguagesMap = getUniqueLanguages(allLanguages);

    return Array.from(uniqueLanguagesMap.entries()).map(([englishName, variants]) => ({
      label: englishName,
      value: englishName, // Use English name as value for tracking
      variants, // Store all Czech variants for API calls
    }));
  }, [allLanguages]);

  // Map to store English name -> Czech variants
  const languageVariantsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    languageOptions.forEach(opt => {
      if ('variants' in opt) {
        map.set(opt.value, opt.variants as string[]);
      }
    });
    return map;
  }, [languageOptions]);

  // Get currently selected unique languages (English names)
  const selectedUniqueLanguages = useMemo(() => {
    if (!filters.languages || filters.languages.length === 0) return [];

    // Map selected Czech variants back to their English names
    const uniqueLanguagesMap = getUniqueLanguages(filters.languages);
    return Array.from(uniqueLanguagesMap.keys());
  }, [filters.languages]);

  const handleCitiesChange = (values: string[]) => {
    onFilterChange({ cities: values.length > 0 ? values : undefined });
  };

  const handleLanguagesChange = (selectedEnglishNames: string[]) => {
    // Expand English names to all their Czech variants
    const allVariants: string[] = [];
    selectedEnglishNames.forEach(englishName => {
      const variants = languageVariantsMap.get(englishName);
      if (variants) {
        allVariants.push(...variants);
      }
    });

    onFilterChange({ languages: allVariants.length > 0 ? allVariants : undefined });
  };

  const handleTargetToggle = (targetId: string) => {
    const currentTargets = filters.targets || [];
    const newTargets = currentTargets.includes(targetId)
      ? currentTargets.filter((id) => id !== targetId)
      : [...currentTargets, targetId];
    onFilterChange({ targets: newTargets.length > 0 ? newTargets : undefined });
  };

  const handleFormatToggle = (formatId: string) => {
    const currentFormats = filters.formats || [];
    const newFormats = currentFormats.includes(formatId)
      ? currentFormats.filter((id) => id !== formatId)
      : [...currentFormats, formatId];
    onFilterChange({ formats: newFormats.length > 0 ? newFormats : undefined });
  };

  const handlePriceFilterChange = (value: "all" | "free" | "paid") => {
    onFilterChange({ priceFilter: value === "all" ? undefined : value });
  };

  const hasActiveFilters = Object.values(filters).some((value) => value && value.length > 0);

  const handleCopyAsMarkdown = () => {
    const markdown = formatEventsAsMarkdown(filteredEvents);
    copyToClipboard(markdown, "Events copied as markdown!");
  };

  const handleCopyAsJSON = () => {
    const json = formatEventsAsJSON(filteredEvents);
    copyToClipboard(json, "Events copied as JSON!");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Filters</h2>
          {hasActiveFilters && (
            <Button onClick={onClearFilters} variant="ghost" size="sm">
              Clear all
            </Button>
          )}
        </div>
        {eventCount !== undefined && (
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{eventCount}</span>
              {totalEvents !== undefined && totalEvents !== eventCount && (
                <> of <span className="font-semibold text-foreground">{totalEvents}</span></>
              )} events
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleCopyAsMarkdown}
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={filteredEvents.length === 0}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Copy as Markdown
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleCopyAsJSON}
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={filteredEvents.length === 0}
                  >
                    <Braces className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Copy as JSON
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
      </div>

      {/* Price Filter */}
      <div className="space-y-2">
        <Label>Price</Label>
        <div className="flex gap-2">
          <Button
            variant={!filters.priceFilter || filters.priceFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => handlePriceFilterChange("all")}
            className="flex-1"
          >
            All
          </Button>
          <Button
            variant={filters.priceFilter === "free" ? "default" : "outline"}
            size="sm"
            onClick={() => handlePriceFilterChange("free")}
            className="flex-1"
          >
            Free
          </Button>
          <Button
            variant={filters.priceFilter === "paid" ? "default" : "outline"}
            size="sm"
            onClick={() => handlePriceFilterChange("paid")}
            className="flex-1"
          >
            Paid
          </Button>
        </div>
      </div>

      {/* Cities Multi-Select */}
      {cityOptions.length > 0 && (
        <div className="space-y-2">
          <Label>Cities</Label>
          <MultiSelect
            options={cityOptions}
            selected={filters.cities || []}
            onChange={handleCitiesChange}
            placeholder="Select cities..."
            emptyText="No cities found."
          />
        </div>
      )}

      {/* Languages Multi-Select */}
      {languageOptions.length > 0 && (
        <div className="space-y-2">
          <Label>Languages</Label>
          <MultiSelect
            options={languageOptions}
            selected={selectedUniqueLanguages}
            onChange={handleLanguagesChange}
            placeholder="Select languages..."
            emptyText="No languages found."
          />
        </div>
      )}

      {/* Event Targets Filter */}
      {targets.length > 0 && (
        <div className="space-y-3">
          <Label>Target Audience</Label>
          <div className="space-y-2">
            {targets.map((target) => target && (
              <div key={target.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`target-${target.id}`}
                  checked={filters.targets?.includes(target.id) || false}
                  onCheckedChange={() => handleTargetToggle(target.id)}
                />
                <label
                  htmlFor={`target-${target.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {translateTarget(target.name)}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Formats Filter */}
      {formats.length > 0 && (
        <div className="space-y-3">
          <Label>Event Format</Label>
          <div className="space-y-2">
            {formats.map((format) => format && (
              <div key={format.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`format-${format.id}`}
                  checked={filters.formats?.includes(format.id) || false}
                  onCheckedChange={() => handleFormatToggle(format.id)}
                />
                <label
                  htmlFor={`format-${format.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {translateFormat(format.name)}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
