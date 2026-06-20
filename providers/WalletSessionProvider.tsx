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
import { CHAIN_ID } from "@/lib/contracts/config";
import { withBasePath } from "@/lib/paths";
import { clearWalletSession, clearWalletStorage } from "@/lib/wallet/clear-session";
import { contractKeys } from "@/lib/contracts/query-keys";

interface WalletSessionContextValue {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  isReady: boolean;
  isWrongNetwork: boolean;
  resetSession: () => void;
  disconnectWallet: () => void | Promise<void>;
}

const WalletSessionContext = createContext<WalletSessionContextValue | null>(null);

export function WalletSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const mounted = useClientMounted();
  const chainId = useChainId();
  const { address, isConnected, isConnecting, isReconnecting, connector } = useAccount();
  const { disconnectAsync, disconnect } = useDisconnect();

  const isReady = mounted && !isConnecting && !isReconnecting;
  const isWrongNetwork = isConnected && chainId !== CHAIN_ID;

  const resetSession = useCallback(() => {
    clearWalletSession(qc);
  }, [qc]);

  const disconnectWallet = useCallback(async () => {
    resetSession();
    clearWalletStorage();
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
    } catch {
      disconnect();
    }
    router.replace(withBasePath("/login"));
  }, [resetSession, disconnectAsync, disconnect, connector, router]);

  const prevAddress = useRef<string | undefined>(undefined);
  const prevChainId = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!isReady) return;

    const next = address?.toLowerCase();
    const prev = prevAddress.current;

    if (prev && next && prev !== next) {
      resetSession();
    }

    if (prev && !isConnected) {
      resetSession();
      router.replace(withBasePath("/login"));
    }

    if (isConnected && next) {
      prevAddress.current = next;
    } else if (!isConnected) {
      prevAddress.current = undefined;
    }
  }, [address, isConnected, isReady, resetSession, router]);

  useEffect(() => {
    if (!isReady || !isConnected) return;
    if (prevChainId.current !== undefined && prevChainId.current !== chainId) {
      qc.invalidateQueries({ queryKey: contractKeys.all });
    }
    prevChainId.current = chainId;
  }, [chainId, isConnected, isReady, qc]);

  const value = useMemo(
    () => ({
      address,
      isConnected: !!isConnected,
      isReady,
      isWrongNetwork,
      resetSession,
      disconnectWallet,
    }),
    [address, isConnected, isReady, isWrongNetwork, resetSession, disconnectWallet]
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
      resetSession: () => {},
      disconnectWallet: () => {},
    };
  }
  return ctx;
}
