import type { Event } from "@/lib/types/graphql";
import {
  translateLanguage,
  translateTarget,
  translateFormat,
  translateCity,
} from "@/lib/translations/czech-to-english";

/**
 * Format a single event as markdown with standard details
 */
function formatEventAsMarkdown(event: Event): string {
  const lines: string[] = [];

  // Event name as heading
  lines.push(`## ${event.name || "Untitled Event"}`);
  lines.push("");

  // Date and time
  const date = event.term
    ? new Date(event.term).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Date TBA";
  lines.push(`**Date:** ${date}`);

  if (event.start_time) {
    lines.push(`**Time:** ${event.start_time}${event.end_time ? ` - ${event.end_time}` : ""}`);
  }

  // Location
  if (event.location) {
    const locationParts = [event.location.name];
    if (event.location.address) {
      locationParts.push(event.location.address);
    }
    if (event.location.city?.name) {
      locationParts.push(translateCity(event.location.city.name));
    }
    lines.push(`**Location:** ${locationParts.join(", ")}`);
  }

  // Price
  const price =
    event.price === 0
      ? "Free"
      : event.price && event.maxPrice && event.price !== event.maxPrice
        ? `€${event.price} - €${event.maxPrice}`
        : event.price
          ? `€${event.price}`
          : "Price TBA";
  lines.push(`**Price:** ${price}`);

  // Languages
  if (event.languages && event.languages.length > 0) {
    const translatedLanguages = event.languages
      .map((lang) => translateLanguage(lang))
      .join(", ");
    lines.push(`**Languages:** ${translatedLanguages}`);
  }

  // Target audience
  if (event.targets && event.targets.length > 0) {
    const translatedTargets = event.targets
      .map((target) => translateTarget(target.name))
      .join(", ");
    lines.push(`**Target Audience:** ${translatedTargets}`);
  }

  // Event format
  if (event.formats && event.formats.length > 0) {
    const translatedFormats = event.formats
      .map((format) => translateFormat(format.name))
      .join(", ");
    lines.push(`**Format:** ${translatedFormats}`);
  }

  // Registration link
  if (event.registration_link) {
    lines.push(`**Registration:** ${event.registration_link}`);
  }

  lines.push("");
  lines.push("---");
  lines.push("");

  return lines.join("\n");
}

/**
 * Format multiple events as markdown
 */
export function formatEventsAsMarkdown(events: Event[]): string {
  if (events.length === 0) {
    return "No events to export.";
  }

  const header = `# Events Export\n\n**Total Events:** ${events.length}\n**Exported:** ${new Date().toLocaleString()}\n\n---\n\n`;

  const eventsMarkdown = events.map(formatEventAsMarkdown).join("\n");

  return header + eventsMarkdown;
}

/**
 * Format a single event as a clean JSON object with standard details
 */
function formatEventAsJSONObject(event: Event) {
  return {
    name: event.name || "Untitled Event",
    date: event.term
      ? new Date(event.term).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Date TBA",
    time: event.start_time
      ? `${event.start_time}${event.end_time ? ` - ${event.end_time}` : ""}`
      : null,
    location: event.location
      ? {
          name: event.location.name,
          address: event.location.address,
          city: event.location.city?.name
            ? translateCity(event.location.city.name)
            : null,
        }
      : null,
    price:
      event.price === 0
        ? "Free"
        : event.price && event.maxPrice && event.price !== event.maxPrice
          ? `€${event.price} - €${event.maxPrice}`
          : event.price
            ? `€${event.price}`
            : "Price TBA",
    languages:
      event.languages?.map((lang) => translateLanguage(lang)) || [],
    targetAudience:
      event.targets?.map((target) => translateTarget(target.name)) || [],
    format: event.formats?.map((format) => translateFormat(format.name)) || [],
    registrationLink: event.registration_link,
  };
}

/**
 * Format multiple events as JSON
 */
export function formatEventsAsJSON(events: Event[]): string {
  const data = {
    totalEvents: events.length,
    exportedAt: new Date().toISOString(),
    events: events.map(formatEventAsJSONObject),
  };

  return JSON.stringify(data, null, 2);
}
