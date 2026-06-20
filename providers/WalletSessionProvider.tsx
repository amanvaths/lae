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
import { usePathname, useRouter } from "next/navigation";
import { useAccount, useDisconnect, useChainId } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { useClientMounted } from "@/lib/useClientMounted";
import { CHAIN_ID } from "@/lib/contracts/config";
import { withBasePath } from "@/lib/paths";
import { clearWalletSession } from "@/lib/wallet/clear-session";
import { contractKeys } from "@/lib/contracts/query-keys";
import { isLoginPath, isProtectedAppPath } from "@/lib/wallet/routes";

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
  const pathname = usePathname();
  const qc = useQueryClient();
  const mounted = useClientMounted();
  const chainId = useChainId();
  const { address, isConnected, isConnecting, isReconnecting, connector } = useAccount();
  const { disconnectAsync, disconnect } = useDisconnect();

  const isReady = mounted && !isConnecting && !isReconnecting;
  const isWrongNetwork = isConnected && chainId !== CHAIN_ID;

  const disconnectingRef = useRef(false);
  const prevAddress = useRef<string | undefined>(undefined);
  const prevChainId = useRef<number | undefined>(undefined);

  const resetSession = useCallback(() => {
    clearWalletSession(qc);
  }, [qc]);

  const redirectToLogin = useCallback(() => {
    if (isLoginPath(pathname)) return;
    router.replace(withBasePath("/login"));
  }, [pathname, router]);

  const disconnectWallet = useCallback(async () => {
    disconnectingRef.current = true;
    resetSession();
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
    } catch {
      disconnect();
    } finally {
      disconnectingRef.current = false;
      prevAddress.current = undefined;
      if (isProtectedAppPath(pathname)) {
        redirectToLogin();
      }
    }
  }, [resetSession, disconnectAsync, disconnect, connector, pathname, redirectToLogin]);

  useEffect(() => {
    if (!isReady) return;

    const next = address?.toLowerCase();
    const prev = prevAddress.current;

    if (prev && next && prev !== next) {
      resetSession();
    }

    if (prev && !isConnected && !disconnectingRef.current) {
      resetSession();
      if (isProtectedAppPath(pathname)) {
        redirectToLogin();
      }
    }

    if (isConnected && next) {
      prevAddress.current = next;
    } else if (!isConnected) {
      prevAddress.current = undefined;
    }
  }, [address, isConnected, isReady, resetSession, pathname, redirectToLogin]);

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
