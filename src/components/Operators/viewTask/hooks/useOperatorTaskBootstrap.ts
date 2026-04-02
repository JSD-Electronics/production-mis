"use client";

import * as React from "react";
import { getOperatorTaskBootstrap, getOperatorTaskRefresh } from "@/lib/api";

type UseOperatorTaskBootstrapOptions = {
  planId?: string;
  operatorId?: string;
  pollMs?: number;
  enabled?: boolean;
};

export default function useOperatorTaskBootstrap({
  planId,
  operatorId,
  pollMs = 30000,
  enabled = true,
}: UseOperatorTaskBootstrapOptions) {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const requestIdRef = React.useRef(0);

  const canLoad = Boolean(enabled && planId && operatorId);

  const loadBootstrap = React.useCallback(async () => {
    if (!canLoad) return null;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const response = await getOperatorTaskBootstrap(planId, operatorId);
      if (requestId === requestIdRef.current) {
        setData(response?.data || null);
      }
      return response?.data || null;
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [canLoad, planId, operatorId]);

  const refreshNow = React.useCallback(async () => {
    if (!canLoad) return null;
    setRefreshing(true);
    try {
      const response = await getOperatorTaskRefresh(planId, operatorId);
      const payload = response?.data || null;
      setData((prev: any) => {
        if (!payload) return prev;
        return {
          ...(prev || {}),
          ...payload,
        };
      });
      return payload;
    } finally {
      setRefreshing(false);
    }
  }, [canLoad, planId, operatorId]);

  React.useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

  React.useEffect(() => {
    if (!canLoad || pollMs <= 0) return;
    const intervalId = window.setInterval(() => {
      refreshNow().catch(() => null);
    }, pollMs);
    return () => window.clearInterval(intervalId);
  }, [canLoad, pollMs, refreshNow]);

  return {
    data,
    loading,
    refreshing,
    loadBootstrap,
    refreshNow,
    setData,
  };
}
