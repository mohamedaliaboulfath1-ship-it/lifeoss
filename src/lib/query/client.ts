import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 90_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 1,
      },
    },
  });
}

let browserClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserClient) browserClient = makeQueryClient();
  return browserClient;
}
