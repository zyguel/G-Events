/**
 * Event Management API - Supabase-backed CRUD operations for tickets, add-ons,
 * promo codes, and settings. Called from client components via API routes.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Ticket {
  id: string;
  name: string;
  type: 'paid' | 'free';
  quantity: number;
  waitlistReservedQuantity: number;
  price?: number;
  currency?: string;
  startDate: string;
  endDate: string;
  timezone: string;
  description?: string;
  visibility: 'visible' | 'hidden';
  isDeleted?: boolean;
  minQuantity: number;
  maxQuantity: number;
  usedQuantity: number;
  createdAt: string;
}

export interface AddOnVariant {
  id: string;
  label: string;
  stock: number;
}

export interface AddOn {
  id: string;
  name: string;
  image?: string;
  imageFile?: File; // Raw file for upload (client-only, not persisted)
  description: string;
  hasVariants: boolean;
  variants: AddOnVariant[];
  stock: number;
  appliedTo: 'all' | string[];
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

/** Resolve the event numeric ID from the slug-style eventId (e.g. "my-event-42" → 42, or "42" → 42) */
function resolveEventId(eventId: string): string {
  const parts = eventId.split('-');
  const last = parts[parts.length - 1];
  return /^\d+$/.test(last) ? last : eventId;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || `API request failed: ${res.status}`);
  }
  return json.data as T;
}

// ============================================================================
// DB → FRONTEND MAPPERS
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbTicket(row: any): Ticket {
  return {
    id: String(row.id),
    name: row.name ?? '',
    type: row.price && Number(row.price) > 0 ? 'paid' : 'free',
    quantity: row.available_quantity ?? 0,
    waitlistReservedQuantity: Number(row.waitlist_reserved_quantity ?? 0),
    price: row.price ? Number(row.price) : 0,
    currency: 'PHP',
    startDate: row.selling_start_at ?? '',
    endDate: row.selling_end_at ?? '',
    timezone: 'Asia/Manila',
    description: row.description ?? '',
    visibility: row.is_hidden ? 'hidden' : 'visible',
    isDeleted: !!row.is_deleted,
    minQuantity: row.min_per_user ?? 1,
    maxQuantity: row.max_per_user ?? 1,
    usedQuantity: row.used_quantity ?? 0,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbAddOn(row: any): AddOn {
  const dbVariants: any[] = row.AddOnVariant ?? [];
  const variants: AddOnVariant[] = dbVariants.map((v: any) => ({
    id: String(v.id),
    label: v.label ?? v.code ?? '',
    stock: v.stock_total ?? 0,
  }));
  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

  return {
    id: String(row.id),
    name: row.name ?? '',
    description: row.description ?? '',
    image: row.image_path ?? '',
    hasVariants: row.has_variants ?? false,
    variants,
    stock: totalStock,
    appliedTo: 'all',
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbPromotion(row: any): PromoCode {
  const ticketLinks: any[] = row.PromotionTicket ?? [];
  const appliedTo: 'all' | string[] =
    ticketLinks.length > 0
      ? ticketLinks.map((pt: any) => String(pt.ticket_id))
      : 'all';

  // Derive status from dates
  const now = new Date();
  const start = row.start_at ? new Date(row.start_at) : null;
  const end = row.end_at ? new Date(row.end_at) : null;
  let status: 'active' | 'inactive' = 'active';
  if (end && end < now) status = 'inactive';
  if (start && start > now) status = 'inactive';

  return {
    id: String(row.id),
    code: row.code ?? '',
    type: row.is_automatic ? 'discount' : 'promo_code',
    valueType: (row.discount_type === 'fixed' ? 'fixed' : 'percentage') as 'percentage' | 'fixed',
    value: row.discount_value ? Number(row.discount_value) : 0,
    startDate: row.start_at ?? '',
    endDate: row.end_at ?? '',
    appliedTo,
    usageLimit: row.max_uses ?? 0,
    usageCount: row.current_uses ?? 0,
    status,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

// ============================================================================
// FRONTEND → DB MAPPERS
// ============================================================================

function ticketToDb(ticket: Partial<Omit<Ticket, 'id' | 'createdAt' | 'usedQuantity'>>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fields: any = {};
  if (ticket.name !== undefined) fields.name = ticket.name;
  if (ticket.description !== undefined) fields.description = ticket.description;
  if (ticket.price !== undefined) fields.price = ticket.price;
  if (ticket.quantity !== undefined) fields.available_quantity = ticket.quantity;
  if (ticket.minQuantity !== undefined) fields.min_per_user = ticket.minQuantity;
  if (ticket.maxQuantity !== undefined) fields.max_per_user = ticket.maxQuantity;
  if (ticket.startDate !== undefined) fields.selling_start_at = ticket.startDate || null;
  if (ticket.endDate !== undefined) fields.selling_end_at = ticket.endDate || null;
  if (ticket.visibility !== undefined) fields.is_hidden = ticket.visibility === 'hidden';
  if (ticket.isDeleted !== undefined) fields.is_deleted = ticket.isDeleted;
  return fields;
}

function addOnToDb(addOn: Partial<Omit<AddOn, 'id' | 'createdAt'>>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fields: any = {};
  if (addOn.name !== undefined) fields.name = addOn.name;
  if (addOn.description !== undefined) fields.description = addOn.description;
  if (addOn.image !== undefined) fields.image_path = addOn.image;
  if (addOn.hasVariants !== undefined) fields.has_variants = addOn.hasVariants;
  return fields;
}

function addOnVariantsToDb(variants: AddOnVariant[], stock?: number) {
  if (variants && variants.length > 0) {
    return variants.map((v) => ({
      code: v.label.toLowerCase().replace(/\s+/g, '_'),
      label: v.label,
      stock_total: v.stock,
    }));
  }
  // When there are no named variants but stock is provided, create a default variant
  if (stock !== undefined && stock > 0) {
    return [{ code: 'default', label: 'Default', stock_total: stock }];
  }
  return undefined;
}

function promoToDb(promo: Partial<Omit<PromoCode, 'id' | 'createdAt'>>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fields: any = {};
  if (promo.code !== undefined) {
    fields.code = promo.code;
    fields.name = promo.code; // Use code as name
  }
  if (promo.valueType !== undefined) fields.discount_type = promo.valueType;
  if (promo.value !== undefined) fields.discount_value = promo.value;
  if (promo.startDate !== undefined) fields.start_at = promo.startDate || null;
  if (promo.endDate !== undefined) fields.end_at = promo.endDate || null;
  if (promo.usageLimit !== undefined) fields.max_uses = promo.usageLimit;
  if (promo.usageCount !== undefined) fields.current_uses = promo.usageCount;
  if (promo.type !== undefined) fields.is_automatic = promo.type === 'discount';
  return fields;
}

function promoTicketIds(appliedTo: 'all' | string[] | undefined): number[] | undefined {
  if (appliedTo === undefined) return undefined;
  if (appliedTo === 'all') return [];
  return appliedTo.map((id) => parseInt(id, 10)).filter((n) => !isNaN(n));
}

// ============================================================================
// TICKETS CRUD
// ============================================================================

export async function getTickets(eventId: string, options?: { includeDeleted?: boolean }): Promise<Ticket[]> {
  const numId = resolveEventId(eventId);
  const query = options?.includeDeleted ? '?includeDeleted=1' : '';
  const rows = await apiFetch<any[]>(`/api/events/${numId}/tickets${query}`);
  return rows.map(mapDbTicket);
}

export async function createTicket(eventId: string, ticket: Omit<Ticket, 'id' | 'createdAt' | 'usedQuantity'>): Promise<Ticket> {
  const numId = resolveEventId(eventId);
  const body = ticketToDb(ticket);
  const row = await apiFetch<any>(`/api/events/${numId}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return mapDbTicket(row);
}

export async function updateTicket(eventId: string, ticketId: string, updates: Partial<Ticket>): Promise<Ticket | null> {
  const numEventId = resolveEventId(eventId);
  const body = ticketToDb(updates);
  const row = await apiFetch<any>(`/api/events/${numEventId}/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return mapDbTicket(row);
}

export async function deleteTicket(eventId: string, ticketId: string): Promise<boolean> {
  const numEventId = resolveEventId(eventId);
  await apiFetch<any>(`/api/events/${numEventId}/tickets/${ticketId}`, {
    method: 'DELETE',
  });
  return true;
}

export async function restoreTicket(eventId: string, ticketId: string): Promise<Ticket> {
  const numEventId = resolveEventId(eventId);
  const row = await apiFetch<any>(`/api/events/${numEventId}/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'restore' }),
  });
  return mapDbTicket(row);
}

// ============================================================================
// ADD-ONS CRUD
// ============================================================================

export async function getAddOns(eventId: string): Promise<AddOn[]> {
  const numId = resolveEventId(eventId);
  const rows = await apiFetch<any[]>(`/api/events/${numId}/addons`);
  return rows.map(mapDbAddOn);
}

function buildAddOnFormData(
  addOn: Partial<Omit<AddOn, 'id' | 'createdAt'>>,
  variants?: ReturnType<typeof addOnVariantsToDb>
): FormData {
  const fd = new FormData();
  if (addOn.name !== undefined) fd.append('name', addOn.name);
  if (addOn.description !== undefined) fd.append('description', addOn.description);
  if (addOn.hasVariants !== undefined) fd.append('has_variants', String(addOn.hasVariants));
  if (addOn.imageFile) fd.append('image', addOn.imageFile);
  if (variants) fd.append('variants', JSON.stringify(variants));
  return fd;
}

export async function createAddOn(eventId: string, addOn: Omit<AddOn, 'id' | 'createdAt'>): Promise<AddOn> {
  const numId = resolveEventId(eventId);
  const variants = addOnVariantsToDb(addOn.variants, addOn.stock);
  const fd = buildAddOnFormData(addOn, variants);
  const row = await apiFetch<any>(`/api/events/${numId}/addons`, {
    method: 'POST',
    body: fd,
  });
  return mapDbAddOn(row);
}

export async function updateAddOn(eventId: string, addOnId: string, updates: Partial<AddOn>): Promise<AddOn | null> {
  const numEventId = resolveEventId(eventId);
  const variants = updates.variants !== undefined
    ? addOnVariantsToDb(updates.variants, updates.stock)
    : (updates.stock !== undefined ? addOnVariantsToDb([], updates.stock) : undefined);
  const fd = buildAddOnFormData(updates, variants);
  const row = await apiFetch<any>(`/api/events/${numEventId}/addons/${addOnId}`, {
    method: 'PATCH',
    body: fd,
  });
  return mapDbAddOn(row);
}

export async function deleteAddOn(eventId: string, addOnId: string): Promise<boolean> {
  const numEventId = resolveEventId(eventId);
  await apiFetch<any>(`/api/events/${numEventId}/addons/${addOnId}`, {
    method: 'DELETE',
  });
  return true;
}

// ============================================================================
// PROMO CODES CRUD
// ============================================================================

export async function getPromoCodes(eventId: string): Promise<PromoCode[]> {
  const numId = resolveEventId(eventId);
  const rows = await apiFetch<any[]>(`/api/events/${numId}/promotions`);
  return rows.map(mapDbPromotion);
}

export async function createPromoCode(eventId: string, promoCode: Omit<PromoCode, 'id' | 'createdAt'>): Promise<PromoCode> {
  const numId = resolveEventId(eventId);
  const fields = promoToDb(promoCode);
  const ticket_ids = promoTicketIds(promoCode.appliedTo);
  const row = await apiFetch<any>(`/api/events/${numId}/promotions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...fields, ticket_ids }),
  });
  return mapDbPromotion(row);
}

export async function updatePromoCode(eventId: string, promoCodeId: string, updates: Partial<PromoCode>): Promise<PromoCode | null> {
  const numEventId = resolveEventId(eventId);
  const fields = promoToDb(updates);
  const ticket_ids = promoTicketIds(updates.appliedTo);
  const row = await apiFetch<any>(`/api/events/${numEventId}/promotions/${promoCodeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...fields, ticket_ids }),
  });
  return mapDbPromotion(row);
}

export async function deletePromoCode(eventId: string, promoCodeId: string): Promise<boolean> {
  const numEventId = resolveEventId(eventId);
  await apiFetch<any>(`/api/events/${numEventId}/promotions/${promoCodeId}`, {
    method: 'DELETE',
  });
  return true;
}

// ============================================================================
// EVENT SETTINGS CRUD (localStorage – no dedicated DB table)
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

export async function getEventSettings(eventId: string): Promise<EventSettings> {
  return getFromStorage<EventSettings>(`event_settings_${eventId}`, {
    eventId,
    displayTicketsRemaining: false,
    displayMessageAfterSalesEnd: false,
    messageAfterSalesEnd: '',
    updatedAt: new Date().toISOString(),
  });
}

export async function updateEventSettings(eventId: string, updates: Partial<EventSettings>): Promise<EventSettings> {
  const settings = await getEventSettings(eventId);

  const updatedSettings = {
    ...settings,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveToStorage(`event_settings_${eventId}`, updatedSettings);
  return updatedSettings;
}
