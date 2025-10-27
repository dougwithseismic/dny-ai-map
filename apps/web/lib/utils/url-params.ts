import type { EventsQueryVariables } from "@/lib/types/graphql";

/**
 * Serialize filters to URL search params
 */
export function filtersToSearchParams(
  filters: EventsQueryVariables
): URLSearchParams {
  const params = new URLSearchParams();

  // Helper to add array params
  const addArrayParam = (key: string, values?: string[]) => {
    if (values && values.length > 0) {
      params.set(key, values.join(","));
    }
  };

  addArrayParam("cities", filters.cities);
  addArrayParam("dates", filters.dates);
  addArrayParam("topic", filters.topic);
  addArrayParam("targets", filters.targets);
  addArrayParam("formats", filters.formats);
  addArrayParam("year", filters.year);
  addArrayParam("languages", filters.languages);

  // Add single value param for priceFilter
  if (filters.priceFilter && filters.priceFilter !== "all") {
    params.set("price", filters.priceFilter);
  }

  return params;
}

/**
 * Deserialize URL search params to filters
 */
export function searchParamsToFilters(
  searchParams: URLSearchParams
): EventsQueryVariables {
  const filters: EventsQueryVariables = {};

  // Helper to parse array params
  const parseArrayParam = (key: string): string[] | undefined => {
    const value = searchParams.get(key);
    if (!value) return undefined;
    return value
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  };

  const cities = parseArrayParam("cities");
  if (cities) filters.cities = cities;

  const dates = parseArrayParam("dates");
  if (dates) filters.dates = dates;

  const topic = parseArrayParam("topic");
  if (topic) filters.topic = topic;

  const targets = parseArrayParam("targets");
  if (targets) filters.targets = targets;

  const formats = parseArrayParam("formats");
  if (formats) filters.formats = formats;

  const year = parseArrayParam("year");
  if (year) filters.year = year;

  const languages = parseArrayParam("languages");
  if (languages) filters.languages = languages;

  const priceFilter = searchParams.get("price");
  if (priceFilter === "free" || priceFilter === "paid") {
    filters.priceFilter = priceFilter;
  }

  return filters;
}

/**
 * Create a new URL with updated filters
 */
export function createUrlWithFilters(
  pathname: string,
  filters: EventsQueryVariables
): string {
  const params = filtersToSearchParams(filters);
  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}
