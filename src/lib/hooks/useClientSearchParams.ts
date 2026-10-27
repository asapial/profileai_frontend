"use client";

import { useMemo, useSyncExternalStore } from "react";

// `useSearchParams` suspends during static rendering, which means every caller
// needs a Suspense boundary. On a direct load Next can leave the boundary on
// its fallback when the client tree does not resume, so auth pages show
// "Loading form…" forever. Reading the browser URL through an external store
// keeps the server snapshot empty, hydrates without a mismatch, and never
// suspends.
const subscribe = (onStoreChange: () => void) => {
  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
};

const getSnapshot = () => window.location.search;
const getServerSnapshot = () => "";

export function useClientSearchParams(): URLSearchParams {
  const search = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => new URLSearchParams(search), [search]);
}
