"use client";

import { useState, useEffect, useCallback } from "react";
import { getContentCache } from "./content-cache";

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number,
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const cache = getContentCache();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const cachedData = cache.get<T>(key);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      const freshData = await fetcher();
      cache.set(key, freshData, ttl);
      setData(freshData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl, cache]);

  useEffect(() => {
    fetchData();
  }, [key, fetchData]);

  const refetch = async () => {
    cache.delete(key);
    await fetchData();
  };

  return { data, loading, error, refetch };
}
