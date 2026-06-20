"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AdminFetchResult } from "@/lib/lae-club/admin-api";

export function useAdminFetch<T>(
  key: string,
  fetcher: () => Promise<AdminFetchResult<T>>
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let result = await fetcherRef.current();
    if (!result.ok) {
      await new Promise((r) => setTimeout(r, 400));
      result = await fetcherRef.current();
    }
    if (result.ok) {
      setData(result.data);
      setError(null);
    } else {
      setData(null);
      setError(result.error);
    }
    setLoading(false);
  }, [key]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, error, loading, retry: load };
}
