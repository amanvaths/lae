"use client";

import { createContext, useContext, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Web3Providers } from "./web3-providers";

const Web3LoadedContext = createContext(true);

export function useWeb3Loaded() {
  return useContext(Web3LoadedContext);
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Web3LoadedContext.Provider value={true}>
        <Web3Providers>{children}</Web3Providers>
      </Web3LoadedContext.Provider>
    </QueryClientProvider>
  );
}
