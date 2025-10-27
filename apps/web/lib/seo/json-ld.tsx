import type { Event } from "@/lib/types/graphql";
import { addUtmParams } from "@/lib/utils/utm";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dny.ai";
const ORGANIZATION_NAME = "Withseismic";

export interface JsonLd {
  "@context": string;
  "@type": string;
  [key: string]: unknown;
}

/**
 * Generate Organization JSON-LD schema
 */
export function generateOrganizationSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://withseismic.com/#organization",
    name: ORGANIZATION_NAME,
    url: "https://withseismic.com",
    logo: {
      "@type": "ImageObject",
      url: "https://withseismic.com/logo.png",
    },
    sameAs: [
      `${SITE_URL}`,
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      availableLanguage: ["English", "French", "Dutch"],
    },
  };
}

/**
 * Generate WebSite JSON-LD schema
 */
export function generateWebSiteSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "DNY.AI Events - Powered by Withseismic",
    publisher: {
      "@id": "https://withseismic.com/#organization",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generate Event JSON-LD schema for individual event pages
 */
export function generateEventSchema(event: Event): JsonLd {
  const eventUrl = `${SITE_URL}/${event.slug}`;

  // Build location object
  const location = event.location ? {
    "@type": "Place",
    name: event.location.name || undefined,
    address: event.location.address ? {
      "@type": "PostalAddress",
      streetAddress: event.location.address,
      addressLocality: event.location.city?.name || undefined,
      addressCountry: "BE",
    } : undefined,
    geo: event.location.latitude && event.location.longitude ? {
      "@type": "GeoCoordinates",
      latitude: event.location.latitude,
      longitude: event.location.longitude,
    } : undefined,
  } : undefined;

  // Build offers object (pricing)
  const offers = event.price !== null ? {
    "@type": "Offer",
    price: event.price,
    priceCurrency: "EUR",
    url: event.registration_link ? (addUtmParams(event.registration_link) || event.registration_link) : eventUrl,
    availability: event.price === 0 ? "https://schema.org/InStock" : "https://schema.org/InStock",
    validFrom: new Date().toISOString(),
  } : undefined;

  // Build organizer - link to Withseismic as the platform
  const organizer = event.organisers && event.organisers.length > 0 ?
    event.organisers.map(org => ({
      "@type": "Organization",
      name: org.name || undefined,
      url: org.social_networks?.[0]?.link || undefined,
    })) : [{
      "@type": "Organization",
      "@id": "https://withseismic.com/#organization",
      name: ORGANIZATION_NAME,
      url: "https://withseismic.com",
    }];

  // Build performers (from program speakers)
  const performers = event.program?.filter(p => p.speaker).map(p => ({
    "@type": "Person",
    name: p.speaker,
  }));

  // Build schema with enhanced data
  const schema: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": eventUrl,
    name: event.name || "",
    url: eventUrl,
    description: event.content?.replace(/<[^>]*>/g, "").substring(0, 500) || `Join us for ${event.name} in Belgium. Discover this event on DNY.AI, powered by Withseismic.`,
    startDate: event.term || undefined,
    endDate: event.term || undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: event.location?.name?.toLowerCase().includes("online") || event.location?.name?.toLowerCase().includes("virtual")
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    location,
    organizer: organizer?.[0],
    offers,
    performer: performers && performers.length > 0 ? performers : undefined,
    inLanguage: event.languages || undefined,
    keywords: [
      ...(event.tags || []),
      ...(event.targets?.map(t => t.name) || []),
      "Belgium",
      "DNY.AI",
      "Withseismic",
    ].join(", "),
    // Reference the publisher/platform
    publisher: {
      "@id": "https://withseismic.com/#organization",
    },
    // Add workFeatured reference to connect to Withseismic
    isAccessibleForFree: event.price === 0 || event.price === null,
  };

  // Add max attendees if available
  if (event.attend) {
    schema.maximumAttendeeCapacity = event.attend;
  }

  // Add typical age range if targets include specific audiences
  if (event.targets && event.targets.length > 0) {
    const targetNames = event.targets.map(t => t.name?.toLowerCase() || "").filter(Boolean);
    if (targetNames.some(name => name.includes("student") || name.includes("youth"))) {
      schema.typicalAgeRange = "18-25";
    }
  }

  return schema;
}

/**
 * Generate ItemList JSON-LD schema for events listing page
 */
export function generateEventsListSchema(events: Event[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: events.map((event, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Event",
        "@id": `${SITE_URL}/${event.slug}`,
        name: event.name,
        url: `${SITE_URL}/${event.slug}`,
        startDate: event.term,
        location: event.location ? {
          "@type": "Place",
          name: event.location.name,
          address: {
            "@type": "PostalAddress",
            addressLocality: event.location.city?.name,
          },
        } : undefined,
      },
    })),
  };
}

/**
 * Generate BreadcrumbList JSON-LD schema
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * Utility component to render JSON-LD script tag
 */
export function JsonLdScript({ data }: { data: JsonLd | JsonLd[] }) {
  const jsonLdArray = Array.isArray(data) ? data : [data];

  return (
    <>
      {jsonLdArray.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema, null, 0),
          }}
        />
      ))}
    </>
  );
}
