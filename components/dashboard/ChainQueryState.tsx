"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { QueryLoading, QueryError } from "./QueryState";

export function ChainQueryState<T>({
  query,
  label = "Loading on-chain data…",
  children,
}: {
  query: Pick<UseQueryResult<T>, "isLoading" | "isError" | "refetch" | "data">;
  label?: string;
  children: (data: T) => React.ReactNode;
}) {
  const pending = query.isLoading && query.data === undefined;
  if (pending) return <QueryLoading label={label} />;
  if (query.isError && query.data === undefined) {
    return <QueryError message="Failed to read from BSC Testnet" onRetry={() => query.refetch()} />;
  }
  if (query.data === undefined) {
    return <QueryError message="Failed to read from BSC Testnet" onRetry={() => query.refetch()} />;
  }
  return <>{children(query.data)}</>;
}
