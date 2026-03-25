'use client';

import { createContext, useContext } from 'react';

type EventDataContextValue = any | null;

const EventDataContext = createContext<EventDataContextValue>(null);

export function EventDataProvider({
  initialEvent,
  children,
}: {
  initialEvent: EventDataContextValue;
  children: React.ReactNode;
}) {
  return <EventDataContext.Provider value={initialEvent}>{children}</EventDataContext.Provider>;
}

export function useEventData() {
  return useContext(EventDataContext);
}
