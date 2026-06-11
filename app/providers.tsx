"use client";

import { createContext, useContext, useEffect, useState } from "react";

const Web3LoadedContext = createContext(false);

export function useWeb3Loaded() {
  return useContext(Web3LoadedContext);
}

/** Loads Wagmi/RainbowKit in a separate chunk after first paint. */
export function Providers({ children }: { children: React.ReactNode }) {
  const [Web3, setWeb3] = useState<
    React.ComponentType<{ children: React.ReactNode }> | null
  >(null);

  useEffect(() => {
    import("./web3-providers").then((m) => setWeb3(() => m.Web3Providers));
  }, []);

  if (!Web3) {
    return (
      <Web3LoadedContext.Provider value={false}>
        {children}
      </Web3LoadedContext.Provider>
    );
  }

  return (
    <Web3LoadedContext.Provider value={true}>
      <Web3>{children}</Web3>
    </Web3LoadedContext.Provider>
  );
}
