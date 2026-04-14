import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { shopApi } from "@/lib/convex";

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export function useEnsureSeeded() {
  const bootstrap = useQuery(shopApi.getBootstrap, {});
  const seedDemoData = useMutation(shopApi.seedDemoData);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!bootstrap || bootstrap.isSeeded || hasTriggeredRef.current) {
      return;
    }
    hasTriggeredRef.current = true;
    void seedDemoData({});
  }, [bootstrap, seedDemoData]);

  return {
    isReady: Boolean(bootstrap?.isSeeded),
  };
}
