import { cacheExchange, createClient, fetchExchange, ssrExchange } from "urql";

const isServerSide = typeof window === "undefined";

const ssrCache = ssrExchange({
  isClient: !isServerSide,
  initialState: !isServerSide ? (window as any).__URQL_DATA__ : undefined,
});

export const urqlClient = createClient({
  url: process.env.GRAPHQL_BACKEND_URL || "https://be.dny.ai/graphql",
  exchanges: [cacheExchange, ssrCache, fetchExchange],
  suspense: isServerSide,
  requestPolicy: "cache-and-network",
});

export { ssrCache };
