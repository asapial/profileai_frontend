"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

/** List pages must not silently present a failed request as an empty account. */
export function AdminQueryNotice() {
  const client = useQueryClient();
  const cache = client.getQueryCache();
  const subscribe = useCallback((notify: () => void) => cache.subscribe(notify), [cache]);
  const snapshot = useCallback(() => cache.getAll().some(query =>
    query.getObserversCount() > 0 && query.state.status === "error" && String(query.queryKey[0]).startsWith("admin")
  ), [cache]);
  const failed = useSyncExternalStore(subscribe, snapshot, () => false);
  if (!failed) return null;
  return <div role="alert" className="mx-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm lg:mx-6">
    <p>Some data on this page could not be loaded. The lists may be incomplete.</p>
    <Button size="sm" variant="outline" onClick={() => void client.refetchQueries({ type: "active", predicate: query => query.state.status === "error" && String(query.queryKey[0]).startsWith("admin") })}>Retry loading</Button>
  </div>;
}
