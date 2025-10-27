"use client";

import { UrqlProvider as BaseUrqlProvider } from "@urql/next";
import { type ReactNode } from "react";
import { cacheExchange, createClient, fetchExchange, ssrExchange } from "urql";

// Create client singleton outside component to prevent recreation
const ssr = ssrExchange({
  isClient: true,
});

const client = createClient({
  url: process.env.NEXT_PUBLIC_GRAPHQL_URL || "/api/graphql",
  exchanges: [
    cacheExchange, // Cache handles deduplication
    ssr,
    fetchExchange,
  ],
  requestPolicy: "cache-first", // Use cache-first to reduce network requests
});

export function UrqlProvider({ children }: { children: ReactNode }) {
  return (
    <BaseUrqlProvider client={client} ssr={ssr}>
      {children}
    </BaseUrqlProvider>
  );
}
