/**
 * Event Management API - Mock CRUD operations for tickets, add-ons, promo codes, and settings
 * This module provides centralized data management for event configuration features
 * using localStorage for persistence.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Ticket {
  id: string;
  name: string;
  type: 'paid' | 'free';
  quantity: number;
  price?: number;
  currency?: string;
  startDate: string;
  endDate: string;
  timezone: string;
  description?: string;
  visibility: 'visible' | 'hidden';
  minQuantity: number;
  maxQuantity: number;
  createdAt: string;
}

export interface AddOn {
  id: string;
  name: string;
  type: string;
  image?: string;
  description: string;
  appliedTo: 'all' | string[];
  inclusions: string[];
  createdAt: string;
}

export interface PromoCode {
  id: string;
  code: string;
  type: 'promo_code' | 'discount';
  valueType: 'percentage' | 'fixed';
  value: number;
  startDate: string;
  endDate: string;
  appliedTo: 'all' | string[];
  usageLimit: number;
  usageCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface EventSettings {
  eventId: string;
  displayTicketsRemaining: boolean;
  displayMessageAfterSalesEnd: boolean;
  messageAfterSalesEnd: string;
  updatedAt: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage`, e);
  }
};

// ============================================================================
// TICKETS CRUD
// ============================================================================

export async function getTickets(eventId: string): Promise<Ticket[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return getFromStorage<Ticket[]>(`event_tickets_${eventId}`, []);
}

export async function createTicket(eventId: string, ticket: Omit<Ticket, 'id' | 'createdAt'>): Promise<Ticket> {
  await new Promise(resolve => setTimeout(resolve, 100));

  const tickets = getFromStorage<Ticket[]>(`event_tickets_${eventId}`, []);

  const newTicket: Ticket = {
    ...ticket,
    id: `tk-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  tickets.push(newTicket);
  saveToStorage(`event_tickets_${eventId}`, tickets);

  return newTicket;
}

export async function updateTicket(eventId: string, ticketId: string, updates: Partial<Ticket>): Promise<Ticket | null> {
  await new Promise(resolve => setTimeout(resolve, 100));

  const tickets = getFromStorage<Ticket[]>(`event_tickets_${eventId}`, []);
  const index = tickets.findIndex(t => t.id === ticketId);

  if (index === -1) return null;

  const updatedTicket = { ...tickets[index], ...updates };
  tickets[index] = updatedTicket;

  saveToStorage(`event_tickets_${eventId}`, tickets);

  return updatedTicket;
}

export async function deleteTicket(eventId: string, ticketId: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 100));

  const tickets = getFromStorage<Ticket[]>(`event_tickets_${eventId}`, []);
  const filteredTickets = tickets.filter(t => t.id !== ticketId);

  if (tickets.length === filteredTickets.length) return false;

  saveToStorage(`event_tickets_${eventId}`, filteredTickets);
  return true;
}

// ============================================================================
// ADD-ONS CRUD
// ============================================================================

export async function getAddOns(eventId: string): Promise<AddOn[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return getFromStorage<AddOn[]>(`event_addons_${eventId}`, []);
}

export async function createAddOn(eventId: string, addOn: Omit<AddOn, 'id' | 'createdAt'>): Promise<AddOn> {
  await new Promise(resolve => setTimeout(resolve, 100));

  const addOns = getFromStorage<AddOn[]>(`event_addons_${eventId}`, []);

  const newAddOn: AddOn = {
    ...addOn,
    id: `ao-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  addOns.push(newAddOn);
  saveToStorage(`event_addons_${eventId}`, addOns);

  return newAddOn;
}

export async function updateAddOn(eventId: string, addOnId: string, updates: Partial<AddOn>): Promise<AddOn | null> {
  await new Promise(resolve => setTimeout(resolve, 100));

  const addOns = getFromStorage<AddOn[]>(`event_addons_${eventId}`, []);
  const index = addOns.findIndex(a => a.id === addOnId);

  if (index === -1) return null;

  const updatedAddOn = { ...addOns[index], ...updates };
  addOns[index] = updatedAddOn;

  saveToStorage(`event_addons_${eventId}`, addOns);

  return updatedAddOn;
}

export async function deleteAddOn(eventId: string, addOnId: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 100));

  const addOns = getFromStorage<AddOn[]>(`event_addons_${eventId}`, []);
  const filteredAddOns = addOns.filter(a => a.id !== addOnId);

  if (addOns.length === filteredAddOns.length) return false;

  saveToStorage(`event_addons_${eventId}`, filteredAddOns);
  return true;
}

// ============================================================================
// PROMO CODES CRUD
// ============================================================================

export async function getPromoCodes(eventId: string): Promise<PromoCode[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return getFromStorage<PromoCode[]>(`event_promocodes_${eventId}`, []);
}

export async function createPromoCode(eventId: string, promoCode: Omit<PromoCode, 'id' | 'createdAt'>): Promise<PromoCode> {
  await new Promise(resolve => setTimeout(resolve, 100));

  const promoCodes = getFromStorage<PromoCode[]>(`event_promocodes_${eventId}`, []);

  const newPromoCode: PromoCode = {
    ...promoCode,
    id: `pc-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  promoCodes.push(newPromoCode);
  saveToStorage(`event_promocodes_${eventId}`, promoCodes);

  return newPromoCode;
}

export async function updatePromoCode(eventId: string, promoCodeId: string, updates: Partial<PromoCode>): Promise<PromoCode | null> {
  await new Promise(resolve => setTimeout(resolve, 100));

  const promoCodes = getFromStorage<PromoCode[]>(`event_promocodes_${eventId}`, []);
  const index = promoCodes.findIndex(p => p.id === promoCodeId);

  if (index === -1) return null;

  const updatedPromoCode = { ...promoCodes[index], ...updates };
  promoCodes[index] = updatedPromoCode;

  saveToStorage(`event_promocodes_${eventId}`, promoCodes);

  return updatedPromoCode;
}

export async function deletePromoCode(eventId: string, promoCodeId: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 100));

  const promoCodes = getFromStorage<PromoCode[]>(`event_promocodes_${eventId}`, []);
  const filteredPromoCodes = promoCodes.filter(p => p.id !== promoCodeId);

  if (promoCodes.length === filteredPromoCodes.length) return false;

  saveToStorage(`event_promocodes_${eventId}`, filteredPromoCodes);
  return true;
}

// ============================================================================
// EVENT SETTINGS CRUD
// ============================================================================

export async function getEventSettings(eventId: string): Promise<EventSettings> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return getFromStorage<EventSettings>(`event_settings_${eventId}`, {
    eventId,
    displayTicketsRemaining: false,
    displayMessageAfterSalesEnd: false,
    messageAfterSalesEnd: '',
    updatedAt: new Date().toISOString(),
  });
}

export async function updateEventSettings(eventId: string, updates: Partial<EventSettings>): Promise<EventSettings> {
  await new Promise(resolve => setTimeout(resolve, 100));

  const settings = await getEventSettings(eventId);

  const updatedSettings = {
    ...settings,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveToStorage(`event_settings_${eventId}`, updatedSettings);
  return updatedSettings;
}
