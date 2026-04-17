import type { SupabaseClient } from "@supabase/supabase-js";
import { parseBreakoutDescription } from "@/lib/breakoutSessionUtils";

export function registrationBlockedForCheckin(status: unknown): boolean {
  const s = String(status || "").toLowerCase();
  return s !== "confirmed";
}

function breakoutSeatInvalid(bsrStatus: unknown): boolean {
  const s = String(bsrStatus || "").toLowerCase();
  return s === "cancelled" || s === "removed";
}

export type BreakoutBsrRow = {
  id: number;
  ticket_token: string;
  check_in_time: string | null;
  status: string | null;
  breakout_session_id: number;
  registration_id: number;
};

export type BreakoutSessionRow = {
  id: number;
  event_id: number;
  name: string | null;
  room_name: string | null;
  description: string | null;
};

export type BreakoutRegRow = {
  id: number;
  event_id: number;
  status: string | null;
  has_checked_in: boolean | null;
  User?: { name?: string; email?: string } | null;
  Ticket?: { name?: string } | null;
};

export type BreakoutTicketResolution =
  | { kind: "missing" }
  | { kind: "error"; status: number; error: string }
  | { kind: "ok"; bsr: BreakoutBsrRow; session: BreakoutSessionRow; reg: BreakoutRegRow };

/**
 * If a BreakoutSessionRegistration row exists for this token, validate it for check-in at this event.
 * Returns { found: false } when no row exists (caller should try main-event ticket).
 */
export async function resolveBreakoutTicketForEventCheckin(
  admin: SupabaseClient,
  token: string,
  eventId: number
): Promise<BreakoutTicketResolution> {
  const { data: bsr, error: bsrErr } = await admin
    .from("BreakoutSessionRegistration")
    .select(
      "id, ticket_token, check_in_time, status, breakout_session_id, registration_id"
    )
    .eq("ticket_token", token)
    .maybeSingle();

  if (bsrErr) {
    return { kind: "error", error: bsrErr.message, status: 500 };
  }
  if (!bsr?.registration_id) {
    return { kind: "missing" };
  }

  if (breakoutSeatInvalid(bsr.status)) {
    return {
      kind: "error",
      error: "This breakout seat is no longer valid",
      status: 400,
    };
  }

  const { data: session, error: sessErr } = await admin
    .from("BreakoutSession")
    .select("id, event_id, name, room_name, description")
    .eq("id", bsr.breakout_session_id)
    .maybeSingle();

  if (sessErr || !session) {
    return {
      kind: "error",
      error: "Breakout session not found",
      status: 404,
    };
  }

  if (Number(session.event_id) !== eventId) {
    return {
      kind: "error",
      error: "This breakout ticket is not for this event",
      status: 404,
    };
  }

  const meta = parseBreakoutDescription(session.description);
  const sessionUiStatus = String(meta.status || "").toLowerCase();
  if (sessionUiStatus === "cancelled") {
    return {
      kind: "error",
      error: "This breakout session was cancelled",
      status: 400,
    };
  }

  const { data: reg, error: regErr } = await admin
    .from("Registration")
    .select("id, event_id, status, has_checked_in, user_id, User(name, email), Ticket(name)")
    .eq("id", bsr.registration_id)
    .maybeSingle();

  if (regErr || !reg) {
    return {
      kind: "error",
      error: "Registration not found for this breakout ticket",
      status: 404,
    };
  }

  if (Number(reg.event_id) !== eventId) {
    return {
      kind: "error",
      error: "This ticket is not for this event",
      status: 404,
    };
  }

  if (registrationBlockedForCheckin(reg.status)) {
    return {
      kind: "error",
      error: "This registration is not confirmed",
      status: 400,
    };
  }

  if (Number(bsr.registration_id) !== Number(reg.id)) {
    return {
      kind: "error",
      error: "Breakout seat does not match registration",
      status: 400,
    };
  }

  return {
    kind: "ok",
    bsr: bsr as BreakoutBsrRow,
    session: session as BreakoutSessionRow,
    reg: reg as BreakoutRegRow,
  };
}
