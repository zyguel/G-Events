import { randomBytes } from "crypto";

/** Opaque token for main e-ticket QR / magic link (stored on Registration.ticket_token). */
export function newTicketToken(): string {
  return randomBytes(24).toString("base64url");
}
