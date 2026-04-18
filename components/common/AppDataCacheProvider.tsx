"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase-browser";

type JsonCacheEntry = {
  status: number;
  data: unknown;
  updatedAt: number;
};

const CACHE_PREFIX = "g_events_api_cache:";
const CACHE_TTL_MS = 2 * 60 * 1000;
const PERIODIC_REFRESH_MS = 2 * 60 * 1000;
const REALTIME_DEBOUNCE_MS = 1500;
const AGGRESSIVE_ADMIN_EVENTS_WARM_MODE = false;
const MAX_CONCURRENT_WARM_REQUESTS = 3;
const GLOBAL_EVENT_WARM_LIMIT = 4;
const ADMIN_EVENTS_LIST_WARM_LIMIT = 4;
const SECONDARY_WARM_DELAY_MS = 250;
const CACHE_HIT_REVALIDATE_INTERVAL_MS = 60 * 1000;
const IN_MEMORY_CACHE_LIMIT = 250;

const STATIC_WARM_ENDPOINTS = [
  "/api/events",
  "/api/management/permissions",
  "/api/notifications",
  "/api/user/locale",
] as const;

const CACHEABLE_PREFIXES = [
  "/api/events",
  "/api/management",
  "/api/analytics",
  "/api/notifications",
  "/api/user/locale",
  "/api/orderform",
  "/api/profile/avatar",
  "/api/regions",
] as const;

const inMemoryCache = new Map<string, JsonCacheEntry>();

function buildGeneralAdminWarmList(pathname: string): string[] {
  const normalized = pathname.toLowerCase();

  if (normalized === "/dashboard" || normalized.startsWith("/dashboard/")) {
    return [
      "/api/analytics/general",
      "/api/analytics/events",
      "/api/profile/avatar",
      "/api/regions",
    ];
  }

  if (normalized === "/management" || normalized.startsWith("/management/")) {
    return [
      "/api/management/users",
      "/api/management/roles",
      "/api/management/permissions",
    ];
  }

  if (normalized === "/profile" || normalized.startsWith("/profile/")) {
    return ["/api/profile/avatar", "/api/user/locale"];
  }

  if (normalized === "/settings" || normalized.startsWith("/settings/")) {
    return ["/api/user/locale", "/api/regions"];
  }

  return [];
}

function toCacheKey(pathWithQuery: string) {
  return `${CACHE_PREFIX}${pathWithQuery}`;
}

function isJsonContentType(contentType: string | null): boolean {
  return !!contentType && contentType.toLowerCase().includes("application/json");
}

function readCache(pathWithQuery: string): JsonCacheEntry | null {
  if (typeof window === "undefined") return null;

  const memoryHit = inMemoryCache.get(pathWithQuery);
  if (memoryHit) {
    return memoryHit;
  }

  try {
    const raw = sessionStorage.getItem(toCacheKey(pathWithQuery));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as JsonCacheEntry;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.updatedAt !== "number") return null;

    inMemoryCache.set(pathWithQuery, parsed);

    return parsed;
  } catch {
    return null;
  }
}

function writeCache(pathWithQuery: string, status: number, data: unknown) {
  if (typeof window === "undefined") return;

  const entry: JsonCacheEntry = {
    status,
    data,
    updatedAt: Date.now(),
  };

  inMemoryCache.set(pathWithQuery, entry);

  if (inMemoryCache.size > IN_MEMORY_CACHE_LIMIT) {
    const firstKey = inMemoryCache.keys().next().value;
    if (typeof firstKey === "string") {
      inMemoryCache.delete(firstKey);
    }
  }

  try {
    sessionStorage.setItem(toCacheKey(pathWithQuery), JSON.stringify(entry));
  } catch {
    // Ignore storage quota/private mode failures.
  }
}

function isFresh(entry: JsonCacheEntry): boolean {
  return Date.now() - entry.updatedAt <= CACHE_TTL_MS;
}

function isCacheableApiPath(pathname: string): boolean {
  return CACHEABLE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isLikelyCacheableApiRequest(input: RequestInfo | URL): boolean {
  const rawUrl =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  // Fast-path guard for the fetch interceptor to bypass non-API requests quickly.
  return rawUrl.includes("/api/");
}

function shouldWarmPath(pathWithQuery: string): boolean {
  const pathname = pathWithQuery.split("?")[0] || "";

  if (pathname === "/api/orderform") {
    return false;
  }

  if (/^\/api\/events\/\d+\/my-breakouts$/.test(pathname)) {
    return false;
  }

  if (/^\/api\/events\/\d+\/certificates\/process$/.test(pathname)) {
    return false;
  }

  return true;
}

function uniqueUrls(urls: string[]): string[] {
  return Array.from(new Set(urls));
}

function resolveRequestUrl(input: RequestInfo | URL): URL | null {
  const rawUrl =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  try {
    return new URL(rawUrl, window.location.origin);
  } catch {
    return null;
  }
}

function normalizePathWithQuery(input: RequestInfo | URL): string | null {
  const url = resolveRequestUrl(input);
  if (!url) {
    return null;
  }

  return `${url.pathname}${url.search}`;
}

function buildCachedJsonResponse(entry: JsonCacheEntry, cacheState: string): Response {
  return new Response(JSON.stringify(entry.data), {
    status: entry.status,
    headers: {
      "Content-Type": "application/json",
      "X-G-Events-Cache": cacheState,
    },
  });
}

function isAdminRealtimeRoute(pathname: string): boolean {
  const normalized = pathname.toLowerCase();
  return (
    normalized === "/dashboard" ||
    normalized.startsWith("/dashboard/") ||
    normalized === "/admin/events" ||
    normalized.startsWith("/admin/events/") ||
    normalized === "/management" ||
    normalized.startsWith("/management/") ||
    normalized === "/profile" ||
    normalized.startsWith("/profile/") ||
    normalized === "/settings" ||
    normalized.startsWith("/settings/")
  );
}

async function storeJsonResponse(pathWithQuery: string, response: Response): Promise<void> {
  const contentType = response.headers.get("content-type");
  if (!isJsonContentType(contentType)) {
    return;
  }

  try {
    const data = await response.json();
    writeCache(pathWithQuery, response.status, data);
  } catch {
    // Ignore non-JSON parse failures.
  }
}

async function fetchAndCache(pathWithQuery: string, fetchImpl: typeof window.fetch): Promise<void> {
  const networkResponse = await fetchImpl(pathWithQuery, {
    method: "GET",
    credentials: "include",
  });
  await storeJsonResponse(pathWithQuery, networkResponse.clone());
}

async function runWithConcurrency(tasks: Array<() => Promise<void>>, maxConcurrent: number): Promise<void> {
  let nextIndex = 0;

  const workers = Array.from({ length: Math.max(1, maxConcurrent) }, async () => {
    while (nextIndex < tasks.length) {
      const current = nextIndex;
      nextIndex += 1;

      try {
        await tasks[current]();
      } catch {
        // Ignore warmup errors per endpoint to keep flow resilient.
      }
    }
  });

  await Promise.all(workers);
}

function buildEventEndpointWarmList(eventIds: number[]): string[] {
  return eventIds.flatMap((eventId) => [
    `/api/analytics/event/${eventId}`,
    `/api/events/${eventId}`,
    `/api/events/${eventId}/addons`,
    `/api/events/${eventId}/breakouts`,
    `/api/events/${eventId}/checkin`,
    `/api/events/${eventId}/checkin/breakout-roster`,
    `/api/events/${eventId}/orders`,
    `/api/events/${eventId}/promotions`,
    `/api/events/${eventId}/tickets`,
    `/api/events/${eventId}/waitlist`,
  ]);
}

function parseEventIdFromAdminPath(pathname: string): number | null {
  const match = pathname.match(/^\/admin\/events\/([^/]+)/);
  if (!match) {
    return null;
  }

  const slug = match[1];
  if (!slug || slug === "new") {
    return null;
  }

  const idPart = slug.split("-").pop() ?? "";
  const eventId = Number.parseInt(idPart, 10);
  return Number.isInteger(eventId) && eventId > 0 ? eventId : null;
}

function parseAdminEventTab(pathname: string): string {
  const match = pathname.match(/^\/admin\/events\/[^/]+(?:\/([^/?#]+))?/);
  const rawTab = (match?.[1] || "overview").toLowerCase();
  return rawTab;
}

function buildAdminEventSharedWarmList(eventId: number): string[] {
  return [
    "/api/management/permissions",
    `/api/events/${eventId}`,
    `/api/analytics/event/${eventId}`,
  ];
}

function buildAdminEventTabWarmList(eventId: number, tab: string): string[] {
  if (tab === "overview") {
    return [
      `/api/events/${eventId}`,
      `/api/analytics/event/${eventId}`,
      `/api/feedback/${eventId}`,
      `/api/feedback/form/${eventId}`,
    ];
  }

  if (tab === "analytics") {
    return [
      `/api/analytics/event/${eventId}`,
      `/api/events/${eventId}`,
      `/api/events/${eventId}/orders`,
      `/api/events/${eventId}/tickets`,
    ];
  }

  if (tab === "checkin") {
    return [
      `/api/events/${eventId}/checkin`,
      `/api/events/${eventId}/checkin/breakout-roster`,
    ];
  }

  if (tab === "email-attendees") {
    return [
      `/api/events/${eventId}/email-attendees`,
      `/api/events/${eventId}/tickets`,
    ];
  }

  if (tab === "reports") {
    return [
      `/api/events/${eventId}/orders`,
      `/api/events/${eventId}/tickets`,
      `/api/analytics/event/${eventId}`,
      `/api/feedback/${eventId}`,
    ];
  }

  if (tab === "publish") {
    return [
      `/api/events/${eventId}`,
      `/api/events/${eventId}/tickets`,
      `/api/events/${eventId}/waitlist`,
    ];
  }

  if (tab === "tickets") {
    return [
      `/api/events/${eventId}/tickets`,
      `/api/events/${eventId}/addons`,
      `/api/events/${eventId}/promotions`,
      `/api/events/${eventId}/waitlist`,
    ];
  }

  if (tab === "breakouts") {
    return [
      `/api/events/${eventId}/breakouts`,
      `/api/events/${eventId}/checkin/breakout-roster`,
    ];
  }

  if (tab === "certificates") {
    return [
      `/api/events/${eventId}/certificates/templates`,
      `/api/events/${eventId}/certificates/recipients`,
    ];
  }

  if (tab === "orders") {
    return [
      `/api/events/${eventId}/orders`,
      `/api/events/${eventId}/tickets`,
      `/api/events/${eventId}/addons`,
    ];
  }

  if (tab === "orderform") {
    return [
      `/api/events/${eventId}/tickets`,
    ];
  }

  if (tab === "orderconfirmation") {
    return [
      `/api/events/${eventId}`,
      `/api/events/${eventId}/orders`,
    ];
  }

  if (tab === "waitlist") {
    return [
      `/api/events/${eventId}/waitlist`,
      `/api/events/${eventId}/tickets`,
    ];
  }

  return [
    `/api/events/${eventId}`,
    `/api/analytics/event/${eventId}`,
  ];
}

function buildAdminEventAllTabWarmList(eventId: number): string[] {
  return [
    ...buildAdminEventSharedWarmList(eventId),
    `/api/events/${eventId}/addons`,
    `/api/events/${eventId}/breakouts`,
    `/api/events/${eventId}/certificates/recipients`,
    `/api/events/${eventId}/certificates/templates`,
    `/api/events/${eventId}/checkin`,
    `/api/events/${eventId}/checkin/breakout-roster`,
    `/api/events/${eventId}/orders`,
    `/api/events/${eventId}/promotions`,
    `/api/events/${eventId}/tickets`,
    `/api/events/${eventId}/waitlist`,
    `/api/feedback/${eventId}`,
    `/api/feedback/form/${eventId}`,
  ];
}

type RouteWarmPlan = {
  primary: string[];
  secondary: string[];
};

function buildAdminEventsRouteWarmPlan(pathname: string, eventIds: number[]): RouteWarmPlan {
  if (!pathname.startsWith("/admin/events")) {
    return { primary: [], secondary: [] };
  }

  const base = [
    "/api/events",
    "/api/management/permissions",
    "/api/analytics/events",
  ];

  const currentEventId = parseEventIdFromAdminPath(pathname);
  if (currentEventId !== null) {
    const tab = parseAdminEventTab(pathname);
    const shared = buildAdminEventSharedWarmList(currentEventId);
    const tabSpecific = buildAdminEventTabWarmList(currentEventId, tab);
    const allForEvent = buildAdminEventAllTabWarmList(currentEventId);

    const primary = uniqueUrls([...base, ...shared, ...tabSpecific]);
    const primarySet = new Set(primary);
    const secondary = uniqueUrls(allForEvent).filter((url) => !primarySet.has(url));

    return { primary, secondary };
  }

  const listEventIds = eventIds.slice(0, ADMIN_EVENTS_LIST_WARM_LIMIT);

  const primary = uniqueUrls([
    ...base,
    ...listEventIds
      .slice(0, 2)
      .flatMap((eventId) => [
        ...buildAdminEventSharedWarmList(eventId),
        ...buildAdminEventTabWarmList(eventId, "overview"),
      ]),
  ]);

  const secondary = uniqueUrls(
    listEventIds.flatMap((eventId) => buildAdminEventAllTabWarmList(eventId))
  ).filter((url) => !primary.includes(url));

  return { primary, secondary };
}

function extractEventIds(payload: unknown): number[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((row) => {
      if (!row || typeof row !== "object") {
        return null;
      }

      const value = (row as { id?: unknown }).id;
      const numeric = Number(value);
      return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
    })
    .filter((value): value is number => value !== null);
}

export default function AppDataCacheProvider() {
  const pathname = usePathname() || "/";
  const warmupTimerRef = useRef<number | null>(null);
  const pathnameRef = useRef(pathname);
  const routeWarmRef = useRef<(nextPath: string) => void>(() => {});

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    const eventIdsRef: { current: number[] } = { current: [] };
    const warmInFlightRef: { current: Map<string, Promise<void>> } = { current: new Map() };
    const backgroundRevalidateRef: { current: Map<string, number> } = { current: new Map() };

    const getEventIds = async (): Promise<number[]> => {
      if (eventIdsRef.current.length > 0) {
        return eventIdsRef.current;
      }

      const cachedEvents = readCache("/api/events");
      if (cachedEvents?.data) {
        const cachedIds = extractEventIds(cachedEvents.data);
        if (cachedIds.length > 0) {
          eventIdsRef.current = cachedIds;
          return cachedIds;
        }
      }

      try {
        const eventsResponse = await originalFetch("/api/events", {
          method: "GET",
          credentials: "include",
        });
        await storeJsonResponse("/api/events", eventsResponse.clone());

        if (eventsResponse.ok) {
          const eventsPayload = await eventsResponse.clone().json().catch(() => null);
          const ids = extractEventIds(eventsPayload);
          eventIdsRef.current = ids;
          return ids;
        }
      } catch {
        // Ignore failures and continue without scoped event IDs.
      }

      return [];
    };

    const warmUrlOnce = async (pathWithQuery: string): Promise<void> => {
      if (!shouldWarmPath(pathWithQuery)) {
        return;
      }

      const cached = readCache(pathWithQuery);
      if (cached && isFresh(cached)) {
        return;
      }

      const existing = warmInFlightRef.current.get(pathWithQuery);
      if (existing) {
        await existing;
        return;
      }

      const next = fetchAndCache(pathWithQuery, originalFetch).finally(() => {
        warmInFlightRef.current.delete(pathWithQuery);
      });

      warmInFlightRef.current.set(pathWithQuery, next);
      await next;
    };

    const warmUrls = async (urls: string[]) => {
      const tasks = uniqueUrls(urls)
        .filter((url) => shouldWarmPath(url))
        .map((url) => () => warmUrlOnce(url));
      await runWithConcurrency(tasks, MAX_CONCURRENT_WARM_REQUESTS);
    };

    const warmForPath = async (nextPath: string) => {
      if (!isAdminRealtimeRoute(nextPath)) {
        return;
      }

      const eventIds = await getEventIds();
      const routePlan = buildAdminEventsRouteWarmPlan(nextPath, eventIds);
      const generalAdminWarmList = buildGeneralAdminWarmList(nextPath);

      const primaryUrls = uniqueUrls([
        ...STATIC_WARM_ENDPOINTS,
        ...generalAdminWarmList,
        ...routePlan.primary,
      ]);

      await warmUrls(primaryUrls);

      if (routePlan.secondary.length > 0) {
        if (SECONDARY_WARM_DELAY_MS <= 0) {
          await warmUrls(routePlan.secondary);
        } else {
          window.setTimeout(() => {
            void warmUrls(routePlan.secondary);
          }, SECONDARY_WARM_DELAY_MS);
        }
      }
    };

    const warmEverything = async () => {
      if (!isAdminRealtimeRoute(pathnameRef.current)) {
        return;
      }

      const eventIds = await getEventIds();
      const scopedEventIds = eventIds.slice(0, GLOBAL_EVENT_WARM_LIMIT);
      const routePlan = buildAdminEventsRouteWarmPlan(pathnameRef.current, eventIds);
      const generalAdminWarmList = buildGeneralAdminWarmList(pathnameRef.current);

      const urls = uniqueUrls([
        ...STATIC_WARM_ENDPOINTS,
        ...generalAdminWarmList,
        ...routePlan.primary,
        ...routePlan.secondary,
        ...buildEventEndpointWarmList(scopedEventIds),
      ]);

      await warmUrls(urls);
    };

    const scheduleWarmup = () => {
      if (warmupTimerRef.current) {
        window.clearTimeout(warmupTimerRef.current);
      }

      warmupTimerRef.current = window.setTimeout(() => {
        void warmForPath(pathnameRef.current);
      }, REALTIME_DEBOUNCE_MS);
    };

    routeWarmRef.current = (nextPath: string) => {
      void warmForPath(nextPath);
    };

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();

      if (method !== "GET" || !isLikelyCacheableApiRequest(input)) {
        return originalFetch(input, init);
      }

      const resolvedUrl = resolveRequestUrl(input);
      if (!resolvedUrl) {
        return originalFetch(input, init);
      }

      const isSameOrigin = resolvedUrl.origin === window.location.origin;
      const pathWithQuery = `${resolvedUrl.pathname}${resolvedUrl.search}`;

      if (!isSameOrigin || method !== "GET" || !isCacheableApiPath(resolvedUrl.pathname)) {
        return originalFetch(input, init);
      }

      const cached = readCache(pathWithQuery);
      if (cached && isFresh(cached)) {
        const lastRevalidateAt = backgroundRevalidateRef.current.get(pathWithQuery) || 0;
        if (Date.now() - lastRevalidateAt >= CACHE_HIT_REVALIDATE_INTERVAL_MS) {
          backgroundRevalidateRef.current.set(pathWithQuery, Date.now());
          void warmUrlOnce(pathWithQuery).catch(() => {
            // Ignore background refresh failures; stale cached data is still served.
          });
        }

        return buildCachedJsonResponse(cached, "HIT");
      }

      const inflightWarm = warmInFlightRef.current.get(pathWithQuery);
      if (inflightWarm) {
        await inflightWarm;
        const refreshed = readCache(pathWithQuery);
        if (refreshed) {
          return buildCachedJsonResponse(refreshed, "INFLIGHT-HIT");
        }
      }

      try {
        const response = await originalFetch(input, init);
        void storeJsonResponse(pathWithQuery, response.clone());
        return response;
      } catch (error) {
        if (cached) {
          return buildCachedJsonResponse(cached, "STALE-NETWORK");
        }

        throw error;
      }
    };

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let authSubscription: { unsubscribe: () => void } | null = null;
    let isActive = true;

    const connectRealtime = () => {
      if (!isActive || channel) {
        return;
      }

      channel = supabase
        .channel("g-events-app-data-cache")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
          },
          () => {
            scheduleWarmup();
          }
        )
        .subscribe();
    };

    const disconnectRealtime = () => {
      if (!channel) {
        return;
      }

      void supabase.removeChannel(channel);
      channel = null;
    };

    if (isAdminRealtimeRoute(pathnameRef.current)) {
      void supabase.auth
        .getSession()
        .then((result: { data: { session: Session | null }; error: unknown }) => {
          if (!isActive) {
            return;
          }

          if (result.error || !result.data.session) {
            return;
          }

          connectRealtime();
        })
        .catch(() => {
          // Ignore auth bootstrap failures; periodic warm and route warm still run.
        });

      const { data } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
        if (!session) {
          disconnectRealtime();
          return;
        }

        connectRealtime();
      });

      authSubscription = data.subscription;
    }

    const periodicRefreshId = window.setInterval(() => {
      if (!document.hidden && isAdminRealtimeRoute(pathnameRef.current)) {
        void warmForPath(pathnameRef.current);
      }
    }, PERIODIC_REFRESH_MS);

    // Warm once after hydration without blocking first paint.
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => {
        void warmEverything();
      });
    } else {
      window.setTimeout(() => {
        void warmEverything();
      }, 250);
    }

    return () => {
      isActive = false;
      window.fetch = originalFetch;
      window.clearInterval(periodicRefreshId);
      if (warmupTimerRef.current) {
        window.clearTimeout(warmupTimerRef.current);
      }
      disconnectRealtime();
      authSubscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    pathnameRef.current = pathname;
    routeWarmRef.current(pathname);
  }, [pathname]);

  return null;
}
