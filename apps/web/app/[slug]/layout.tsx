import type { Metadata } from "next";
import { urqlClient as client } from "@/lib/urql/client";
import { EVENT_BY_SLUG_QUERY } from "@/lib/graphql/queries";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dny.ai";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    // Fetch event data for metadata
    const result = await client.query(EVENT_BY_SLUG_QUERY, { slug }).toPromise();
    const event = result.data?.eventBySlug;

    if (!event) {
      return {
        title: "Event Not Found | DNY.AI - Powered by Withseismic",
        description: "This event could not be found. Discover other events on DNY.AI.",
      };
    }

    // Clean HTML from description
    const description = event.content
      ? event.content.replace(/<[^>]*>/g, "").substring(0, 160)
      : `Join us for ${event.name}. ${event.location?.city?.name ? `In ${event.location.city.name}` : ""} ${event.term ? `on ${new Date(event.term).toLocaleDateString()}` : ""}`;

    // Build comprehensive metadata
    const title = `${event.name} | DNY.AI - Powered by Withseismic`;
    const eventUrl = `${SITE_URL}/${event.slug}`;

    // Build keywords from event data
    const keywords = [
      event.name,
      ...(event.tags || []),
      ...(event.targets?.map((t: { name: string | null }) => t.name) || []),
      ...(event.languages || []),
      event.location?.city?.name,
      "Belgium",
      "DNY.AI",
      "Withseismic",
      "event",
    ].filter(Boolean);

    return {
      title,
      description,
      keywords,
      authors: [{ name: "Withseismic", url: "https://withseismic.com" }],
      creator: "Withseismic",
      publisher: "Withseismic",
      openGraph: {
        type: "website",
        locale: "en_US",
        url: eventUrl,
        siteName: "DNY.AI Events - Powered by Withseismic",
        title: event.name,
        description,
        ...(event.location?.city?.name && {
          countryName: "Belgium",
          locale: "en_BE",
        }),
      },
      twitter: {
        card: "summary_large_image",
        title: event.name,
        description,
        creator: "@withseismic",
      },
      alternates: {
        canonical: eventUrl,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Event | DNY.AI - Powered by Withseismic",
      description: "Discover amazing events on DNY.AI, powered by Withseismic.",
    };
  }
}

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
