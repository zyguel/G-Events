/**
 * Event Management API - Mock CRUD operations for tickets, add-ons, promo codes, and settings
 * This module provides centralized data management for event configuration features
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
// MOCK DATA STORAGE
// ============================================================================

const mockEventData: Record<string, {
  tickets: Ticket[];
  addOns: AddOn[];
  promoCodes: PromoCode[];
  settings: EventSettings;
}> = {
  'devfest-2025': {
    tickets: [
      {
        id: 'tk-001',
        name: 'Early Bird',
        type: 'paid',
        quantity: 100,
        price: 1500,
        currency: 'PHP',
        startDate: '2025-05-01',
        endDate: '2025-06-15',
        timezone: 'Asia/Manila',
        description: 'Limited early bird tickets with 30% discount',
        visibility: 'visible',
        minQuantity: 1,
        maxQuantity: 5,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tk-002',
        name: 'General Admission',
        type: 'paid',
        quantity: 200,
        price: 2000,
        currency: 'PHP',
        startDate: '2025-06-01',
        endDate: '2025-11-15',
        timezone: 'Asia/Manila',
        description: 'Standard ticket for general attendees',
        visibility: 'visible',
        minQuantity: 1,
        maxQuantity: 10,
        createdAt: new Date().toISOString(),
      },
    ],
    addOns: [],
    promoCodes: [],
    settings: {
      eventId: 'devfest-2025',
      displayTicketsRemaining: true,
      displayMessageAfterSalesEnd: true,
      messageAfterSalesEnd: 'Ticket sales have ended. Thank you for your interest!',
      updatedAt: new Date().toISOString(),
    },
  },
  'io-extended-2025': {
    tickets: [],
    addOns: [],
    promoCodes: [],
    settings: {
      eventId: 'io-extended-2025',
      displayTicketsRemaining: false,
      displayMessageAfterSalesEnd: false,
      messageAfterSalesEnd: '',
      updatedAt: new Date().toISOString(),
    },
  },
};

// ============================================================================
// TICKETS CRUD
// ============================================================================

export async function getTickets(eventId: string): Promise<Ticket[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockEventData[eventId]?.tickets || [];
}

export async function createTicket(eventId: string, ticket: Omit<Ticket, 'id' | 'createdAt'>): Promise<Ticket> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (!mockEventData[eventId]) {
    mockEventData[eventId] = { 
      tickets: [], 
      addOns: [], 
      promoCodes: [], 
      settings: { 
        eventId, 
        displayTicketsRemaining: false, 
        displayMessageAfterSalesEnd: false, 
        messageAfterSalesEnd: '', 
        updatedAt: new Date().toISOString() 
      } 
    };
  }

  const newTicket: Ticket = {
    ...ticket,
    id: `tk-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  mockEventData[eventId].tickets.push(newTicket);
  return newTicket;
}

export async function updateTicket(eventId: string, ticketId: string, updates: Partial<Ticket>): Promise<Ticket | null> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const tickets = mockEventData[eventId]?.tickets || [];
  const index = tickets.findIndex(t => t.id === ticketId);

  if (index === -1) return null;

  const updatedTicket = { ...tickets[index], ...updates };
  mockEventData[eventId].tickets[index] = updatedTicket;

  return updatedTicket;
}

export async function deleteTicket(eventId: string, ticketId: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const tickets = mockEventData[eventId]?.tickets || [];
  const index = tickets.findIndex(t => t.id === ticketId);

  if (index === -1) return false;

  mockEventData[eventId].tickets.splice(index, 1);
  return true;
}

// ============================================================================
// ADD-ONS CRUD
// ============================================================================

export async function getAddOns(eventId: string): Promise<AddOn[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockEventData[eventId]?.addOns || [];
}

export async function createAddOn(eventId: string, addOn: Omit<AddOn, 'id' | 'createdAt'>): Promise<AddOn> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (!mockEventData[eventId]) {
    mockEventData[eventId] = { 
      tickets: [], 
      addOns: [], 
      promoCodes: [], 
      settings: { 
        eventId, 
        displayTicketsRemaining: false, 
        displayMessageAfterSalesEnd: false, 
        messageAfterSalesEnd: '', 
        updatedAt: new Date().toISOString() 
      } 
    };
  }

  const newAddOn: AddOn = {
    ...addOn,
    id: `ao-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  mockEventData[eventId].addOns.push(newAddOn);
  return newAddOn;
}

export async function updateAddOn(eventId: string, addOnId: string, updates: Partial<AddOn>): Promise<AddOn | null> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const addOns = mockEventData[eventId]?.addOns || [];
  const index = addOns.findIndex(a => a.id === addOnId);

  if (index === -1) return null;

  const updatedAddOn = { ...addOns[index], ...updates };
  mockEventData[eventId].addOns[index] = updatedAddOn;

  return updatedAddOn;
}

export async function deleteAddOn(eventId: string, addOnId: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const addOns = mockEventData[eventId]?.addOns || [];
  const index = addOns.findIndex(a => a.id === addOnId);

  if (index === -1) return false;

  mockEventData[eventId].addOns.splice(index, 1);
  return true;
}

// ============================================================================
// PROMO CODES CRUD
// ============================================================================

export async function getPromoCodes(eventId: string): Promise<PromoCode[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockEventData[eventId]?.promoCodes || [];
}

export async function createPromoCode(eventId: string, promoCode: Omit<PromoCode, 'id' | 'createdAt'>): Promise<PromoCode> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (!mockEventData[eventId]) {
    mockEventData[eventId] = { 
      tickets: [], 
      addOns: [], 
      promoCodes: [], 
      settings: { 
        eventId, 
        displayTicketsRemaining: false, 
        displayMessageAfterSalesEnd: false, 
        messageAfterSalesEnd: '', 
        updatedAt: new Date().toISOString() 
      } 
    };
  }

  const newPromoCode: PromoCode = {
    ...promoCode,
    id: `pc-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  mockEventData[eventId].promoCodes.push(newPromoCode);
  return newPromoCode;
}

export async function updatePromoCode(eventId: string, promoCodeId: string, updates: Partial<PromoCode>): Promise<PromoCode | null> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const promoCodes = mockEventData[eventId]?.promoCodes || [];
  const index = promoCodes.findIndex(p => p.id === promoCodeId);

  if (index === -1) return null;

  const updatedPromoCode = { ...promoCodes[index], ...updates };
  mockEventData[eventId].promoCodes[index] = updatedPromoCode;

  return updatedPromoCode;
}

export async function deletePromoCode(eventId: string, promoCodeId: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const promoCodes = mockEventData[eventId]?.promoCodes || [];
  const index = promoCodes.findIndex(p => p.id === promoCodeId);

  if (index === -1) return false;

  mockEventData[eventId].promoCodes.splice(index, 1);
  return true;
}

// ============================================================================
// EVENT SETTINGS CRUD
// ============================================================================

export async function getEventSettings(eventId: string): Promise<EventSettings> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockEventData[eventId]?.settings || {
    eventId,
    displayTicketsRemaining: false,
    displayMessageAfterSalesEnd: false,
    messageAfterSalesEnd: '',
    updatedAt: new Date().toISOString(),
  };
}

export async function updateEventSettings(eventId: string, updates: Partial<EventSettings>): Promise<EventSettings> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (!mockEventData[eventId]) {
    mockEventData[eventId] = { 
      tickets: [], 
      addOns: [], 
      promoCodes: [], 
      settings: { 
        eventId, 
        displayTicketsRemaining: false, 
        displayMessageAfterSalesEnd: false, 
        messageAfterSalesEnd: '', 
        updatedAt: new Date().toISOString() 
      } 
    };
  }

  const updatedSettings = {
    ...mockEventData[eventId].settings,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  mockEventData[eventId].settings = updatedSettings;
  return updatedSettings;
}
