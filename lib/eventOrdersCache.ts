const EVENT_ORDERS_CACHE_TTL_MS = 20 * 1000;

type EventOrdersRow = Record<string, unknown>;

type EventOrdersCacheEntry = {
  value: EventOrdersRow[];
  expiresAt: number;
};

const eventOrdersCache = new Map<number, EventOrdersCacheEntry>();

function cloneRows(rows: EventOrdersRow[]): EventOrdersRow[] {
  return rows.map((row) => ({ ...row }));
}

export function getCachedEventOrders(eventId: number): EventOrdersRow[] | null {
  const cached = eventOrdersCache.get(eventId);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    eventOrdersCache.delete(eventId);
    return null;
  }

  return cloneRows(cached.value);
}

export function setCachedEventOrders(eventId: number, rows: EventOrdersRow[]): void {
  eventOrdersCache.set(eventId, {
    value: cloneRows(rows),
    expiresAt: Date.now() + EVENT_ORDERS_CACHE_TTL_MS,
  });
}

export function invalidateEventOrdersCache(eventId?: number): void {
  if (typeof eventId === 'number') {
    eventOrdersCache.delete(eventId);
    return;
  }

  eventOrdersCache.clear();
}
