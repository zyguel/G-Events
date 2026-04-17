import { escapeHtml } from "@/lib/security";
import type { SupabaseClient } from "@supabase/supabase-js";

export type FreeTicketApprovalMode = "manual" | "automatic";

export interface OrderConfirmationEmailTemplate {
  subject: string;
  body: string;
}

export interface OrderConfirmationData {
  submissionMessage: string;
  submissionEmail: OrderConfirmationEmailTemplate;
  confirmationEmail: OrderConfirmationEmailTemplate;
  rejectionEmail: OrderConfirmationEmailTemplate;
  freeTicketApprovalMode: FreeTicketApprovalMode;
}

export const DEFAULT_ORDER_CONFIRMATION_DATA: OrderConfirmationData = {
  submissionMessage: "",
  submissionEmail: {
    subject: "Registration received",
    body: "",
  },
  confirmationEmail: {
    subject: "Registration confirmed",
    body: "",
  },
  rejectionEmail: {
    subject: "Registration update",
    body: "",
  },
  freeTicketApprovalMode: "manual",
};

function normalizeEmailTemplate(
  value: unknown,
  fallback: OrderConfirmationEmailTemplate
): OrderConfirmationEmailTemplate {
  const obj = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    subject:
      typeof obj.subject === "string" && obj.subject.trim().length > 0
        ? obj.subject
        : fallback.subject,
    body: typeof obj.body === "string" ? obj.body : fallback.body,
  };
}

export function normalizeOrderConfirmationData(value: unknown): OrderConfirmationData {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  const freeMode =
    raw.freeTicketApprovalMode === "automatic" || raw.freeTicketApprovalMode === "manual"
      ? raw.freeTicketApprovalMode
      : DEFAULT_ORDER_CONFIRMATION_DATA.freeTicketApprovalMode;

  return {
    submissionMessage:
      typeof raw.submissionMessage === "string"
        ? raw.submissionMessage
        : DEFAULT_ORDER_CONFIRMATION_DATA.submissionMessage,
    submissionEmail: normalizeEmailTemplate(
      raw.submissionEmail,
      DEFAULT_ORDER_CONFIRMATION_DATA.submissionEmail
    ),
    confirmationEmail: normalizeEmailTemplate(
      raw.confirmationEmail,
      DEFAULT_ORDER_CONFIRMATION_DATA.confirmationEmail
    ),
    rejectionEmail: normalizeEmailTemplate(
      raw.rejectionEmail,
      DEFAULT_ORDER_CONFIRMATION_DATA.rejectionEmail
    ),
    freeTicketApprovalMode: freeMode,
  };
}

export async function loadOrderConfirmationSettings(
  supabase: SupabaseClient,
  eventId: number
): Promise<OrderConfirmationData> {
  try {
    const { data, error } = await supabase
      .from("OrderConfirmationSettings")
      .select("settings")
      .eq("event_id", eventId)
      .maybeSingle();

    if (error) {
      console.error("Failed loading OrderConfirmationSettings:", error);
      return { ...DEFAULT_ORDER_CONFIRMATION_DATA };
    }

    return normalizeOrderConfirmationData(data?.settings);
  } catch (error) {
    console.error("Unexpected error loading OrderConfirmationSettings:", error);
    return { ...DEFAULT_ORDER_CONFIRMATION_DATA };
  }
}

export function resolveRegistrationApprovalMode(params: {
  ticketPrice: number;
  settings: Pick<OrderConfirmationData, "freeTicketApprovalMode"> | null | undefined;
}): FreeTicketApprovalMode {
  // Paid tickets are always manually approved.
  if (Number(params.ticketPrice) > 0) {
    return "manual";
  }

  return params.settings?.freeTicketApprovalMode === "automatic" ? "automatic" : "manual";
}

export type TemplateContext = Record<string, string | number | null | undefined>;

function toTemplateTokenValue(key: string, value: string | number | null | undefined): string {
  const normalized = value == null ? "" : String(value);

  // Explicit HTML placeholders should remain raw so rich snippets can be injected intentionally.
  if (key.endsWith("Html") || key.endsWith("Block")) {
    return normalized;
  }

  return escapeHtml(normalized);
}

export function renderTemplateString(template: string, context: TemplateContext): string {
  if (!template) return "";

  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, tokenKey: string) => {
    const direct = context[tokenKey];
    if (direct !== undefined) {
      return toTemplateTokenValue(tokenKey, direct);
    }

    // Support snake_case/camelCase interchangeably for common placeholders.
    const camelToken = tokenKey.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase());
    const snakeToken = tokenKey.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

    if (context[camelToken] !== undefined) {
      return toTemplateTokenValue(camelToken, context[camelToken]);
    }

    if (context[snakeToken] !== undefined) {
      return toTemplateTokenValue(snakeToken, context[snakeToken]);
    }

    return "";
  });
}

export function renderOrderConfirmationTemplate(params: {
  template: OrderConfirmationEmailTemplate;
  fallback: OrderConfirmationEmailTemplate;
  context: TemplateContext;
}): OrderConfirmationEmailTemplate {
  const subjectTemplate =
    params.template.subject && params.template.subject.trim().length > 0
      ? params.template.subject
      : params.fallback.subject;

  const bodyTemplate =
    params.template.body && params.template.body.trim().length > 0
      ? params.template.body
      : params.fallback.body;

  return {
    subject: renderTemplateString(subjectTemplate, params.context),
    body: renderTemplateString(bodyTemplate, params.context),
  };
}

export function buildTicketQrBlock(params: { qrImageUrl: string; ticketUrl: string }): string {
  const qrImageUrl = escapeHtml(params.qrImageUrl);
  const ticketUrl = escapeHtml(params.ticketUrl);

  return `
<div style="margin:24px 0;text-align:center">
  <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#3D518C;text-transform:uppercase;letter-spacing:0.06em">Your e-ticket</p>
  <img src="${qrImageUrl}" alt="Ticket QR code" width="280" height="280" style="display:inline-block;border-radius:12px;border:1px solid #e8ecf4" />
</div>
<p style="margin:0;font-size:13px;color:#666;line-height:1.5">Show this QR code at check-in, or open your ticket online:</p>
<p style="margin:12px 0 0"><a href="${ticketUrl}" style="color:#3D518C;font-weight:600;font-size:14px;word-break:break-all">${ticketUrl}</a></p>
`.trim();
}

export function ensureQrBlockInBody(body: string, qrBlockHtml: string): string {
  if (!body || body.trim().length === 0) {
    return qrBlockHtml;
  }

  // If template intentionally places QR block via placeholder, do not append again.
  if (body.includes("{{qrBlock}}") || body.includes("{{ qrBlock }}")) {
    return body;
  }

  // If a custom body already has an image and link placeholders resolved, avoid duplicates.
  if (body.toLowerCase().includes("<img") && body.toLowerCase().includes("http")) {
    return body;
  }

  return `${body}\n${qrBlockHtml}`;
}

export function wrapEmailBody(innerHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f4f7fc;padding:24px;color:#111">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;box-shadow:0 8px 30px rgba(61,81,140,0.12)">
    ${innerHtml}
  </div>
</body>
</html>
`.trim();
}
