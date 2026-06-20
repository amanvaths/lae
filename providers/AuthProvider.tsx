"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAccount } from "wagmi";
import { useSignMessage } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import {
  clearTokens,
  getAccessToken,
  loadStoredTokens,
  setTokens,
} from "@/lib/api-client";
import { signInWithWallet } from "@/services/auth.service";
import { logoutApi } from "@/lib/api/auth";
import { queryKeys } from "@/lib/api/query-keys";
import type { UserProfile } from "@/lib/api/types";
import { useMe } from "@/hooks/useAuth";

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (referralCode?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const qc = useQueryClient();
  const [bootstrapped, setBootstrapped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginPending, setLoginPending] = useState(false);
  const autoLoginAttempted = useRef(false);

  useEffect(() => {
    loadStoredTokens();
    setBootstrapped(true);
  }, []);

  const hasToken = !!getAccessToken();
  const { data: me, isLoading: meLoading, isError } = useMe(hasToken && bootstrapped);

  const login = useCallback(
    async (referralCode = "LAEROOT") => {
      if (!address) throw new Error("Wallet not connected");
      setLoginPending(true);
      setError(null);
      try {
        const result = await signInWithWallet(address, signMessageAsync, referralCode);
        setTokens(result.accessToken, result.refreshToken);
        await qc.invalidateQueries({ queryKey: queryKeys.auth.me });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Authentication failed";
        setError(msg);
        throw e;
      } finally {
        setLoginPending(false);
      }
    },
    [address, signMessageAsync, qc]
  );

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // ignore — token may already be invalid
    }
    clearTokens();
    qc.clear();
  }, [qc]);

  useEffect(() => {
    if (!isConnected || !address || !bootstrapped || hasToken || loginPending) return;
    if (autoLoginAttempted.current) return;
    autoLoginAttempted.current = true;
    login().catch(() => {});
  }, [isConnected, address, bootstrapped, hasToken, loginPending, login]);

  useEffect(() => {
    if (!isConnected) autoLoginAttempted.current = false;
  }, [isConnected, address]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: me ?? null,
      isAuthenticated: !!me && hasToken,
      isLoading: !bootstrapped || meLoading || loginPending,
      error: isError ? "Session expired" : error,
      login,
      logout,
    }),
    [me, hasToken, bootstrapped, meLoading, loginPending, isError, error, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      login: async () => {},
      logout: async () => {},
    };
  }
  return ctx;
}
