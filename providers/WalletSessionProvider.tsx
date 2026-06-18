"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useAccount, useDisconnect, useChainId } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { useClientMounted } from "@/lib/useClientMounted";
import { contractKeys } from "@/lib/contracts/query-keys";
import { CHAIN_ID } from "@/lib/contracts/config";
import { withBasePath } from "@/lib/paths";

interface WalletSessionContextValue {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  isReady: boolean;
  isWrongNetwork: boolean;
  disconnectWallet: () => void;
}

const WalletSessionContext = createContext<WalletSessionContextValue | null>(null);

export function WalletSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const mounted = useClientMounted();
  const chainId = useChainId();
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { disconnect } = useDisconnect();

  const isReady = mounted && !isConnecting && !isReconnecting;
  const isWrongNetwork = isConnected && chainId !== CHAIN_ID;

  const clearSession = useCallback(() => {
    qc.removeQueries({ queryKey: contractKeys.all });
    qc.clear();
  }, [qc]);

  const disconnectWallet = useCallback(() => {
    clearSession();
    disconnect();
    router.replace(withBasePath("/login"));
  }, [clearSession, disconnect, router]);

  const prevAddress = useRef<string | undefined>(undefined);

  /** Clear cached reads when the wallet account changes or disconnects externally. */
  useEffect(() => {
    if (!isReady) return;

    const next = address?.toLowerCase();
    if (prevAddress.current && next && prevAddress.current !== next) {
      clearSession();
    }
    if (!isConnected) {
      clearSession();
    }
    prevAddress.current = next;
  }, [address, isConnected, isReady, clearSession]);

  const value = useMemo(
    () => ({
      address,
      isConnected: !!isConnected,
      isReady,
      isWrongNetwork,
      disconnectWallet,
    }),
    [address, isConnected, isReady, isWrongNetwork, disconnectWallet]
  );

  return (
    <WalletSessionContext.Provider value={value}>{children}</WalletSessionContext.Provider>
  );
}

export function useWalletSession() {
  const ctx = useContext(WalletSessionContext);
  if (!ctx) {
    return {
      address: undefined,
      isConnected: false,
      isReady: false,
      isWrongNetwork: false,
      disconnectWallet: () => {},
    };
  }
  return ctx;
}
