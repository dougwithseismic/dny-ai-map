import type { Metadata } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import "./globals.css";
import { UrqlProvider } from "@/lib/urql/provider";
import { ThemeProvider } from "@/components/theme-provider";
import { AppShell } from "@/components/app-shell";
import { EventsProvider } from "@/lib/contexts/events-context";
import { TranslationCollectorWidget } from "@/components/dev/translation-collector-widget";
import { MissingLocationsWidget } from "@/components/dev/missing-locations-widget";
import { generateOrganizationSchema, generateWebSiteSchema, JsonLdScript } from "@/lib/seo/json-ld";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "DNY.AI Events - Powered by Withseismic",
  description: "Discover the best events, workshops, and conferences in Belgium curated by DNY.AI. Powered by Withseismic - connecting you with the vibrant Belgian event scene.",
  keywords: ["events", "Belgium", "workshops", "conferences", "networking", "Brussels", "Antwerp", "Ghent", "DNY.AI", "Withseismic"],
  authors: [{ name: "Withseismic" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dny.ai",
    siteName: "DNY.AI Events - Powered by Withseismic",
    title: "DNY.AI Events - Powered by Withseismic",
    description: "Discover the best events, workshops, and conferences in Belgium curated by DNY.AI.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DNY.AI Events - Helpful Events Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DNY.AI Events - Powered by Withseismic",
    description: "Discover the best events, workshops, and conferences in Belgium curated by DNY.AI.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = generateOrganizationSchema();
  const webSiteSchema = generateWebSiteSchema();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLdScript data={[organizationSchema, webSiteSchema]} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UrqlProvider>
            <Suspense fallback={null}>
              <EventsProvider>
                <AppShell>{children}</AppShell>
                <TranslationCollectorWidget />
                {/* <MissingLocationsWidget /> */}
              </EventsProvider>
            </Suspense>
          </UrqlProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
