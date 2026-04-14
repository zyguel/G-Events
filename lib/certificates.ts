import { createHash, randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/emailProvider";
import { escapeHtml } from "@/lib/security";
import type { CertificatePublicView } from "@/lib/certificateLayout";
import {
  CERTIFICATE_CANVAS_HEIGHT,
  CERTIFICATE_CANVAS_WIDTH,
} from "@/lib/certificateLayout";

export interface CertificateRecipient {
  registrationId: number | null;
  name: string;
  email: string;
}

export type { CertificatePublicView } from "@/lib/certificateLayout";
export {
  CERTIFICATE_CANVAS_HEIGHT,
  CERTIFICATE_CANVAS_WIDTH,
} from "@/lib/certificateLayout";

export interface CertificateTemplateRow {
  id: number;
  event_id: number;
  name: string;
  background_image: string;
  name_x: number;
  name_y: number;
  font_size: number;
  font_color: string;
}

interface CertificateIssueRow {
  id: number;
  event_id: number;
  template_id: number;
  registration_id: number | null;
  recipient_name: string;
  recipient_email: string;
  access_token: string;
  issued_at: string | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string | null | undefined): email is string {
  return !!email && EMAIL_REGEX.test(email.trim());
}

function detectImageFormat(dataUrl: string): "PNG" | "JPEG" {
  const lower = dataUrl.toLowerCase();
  if (lower.startsWith("data:image/jpeg") || lower.startsWith("data:image/jpg")) {
    return "JPEG";
  }
  return "PNG";
}

function parseHexColorToRgb(hex: string): [number, number, number] {
  let h = (hex || "#000000").trim();
  if (!h.startsWith("#")) h = `#${h}`;
  if (h.length === 4) {
    const r = parseInt(h[1] + h[1], 16);
    const g = parseInt(h[2] + h[2], 16);
    const b = parseInt(h[3] + h[3], 16);
    return [Number.isNaN(r) ? 0 : r, Number.isNaN(g) ? 0 : g, Number.isNaN(b) ? 0 : b];
  }
  if (h.length === 7) {
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    return [Number.isNaN(r) ? 0 : r, Number.isNaN(g) ? 0 : g, Number.isNaN(b) ? 0 : b];
  }
  return [0, 0, 0];
}

async function urlToDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:image/")) return url;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch certificate background (${response.status})`);
  }

  const contentType = response.headers.get("content-type") || "image/png";
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return `data:${contentType};base64,${base64}`;
}

export async function buildCertificatePdfBuffer(
  template: CertificateTemplateRow,
  recipientName: string,
  verificationText?: string
): Promise<Buffer> {
  const jsPDFModule = await import("jspdf/dist/jspdf.es.min.js");
  const jsPDF = (jsPDFModule as any).jsPDF || (jsPDFModule as any).default;
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [CERTIFICATE_CANVAS_WIDTH, CERTIFICATE_CANVAS_HEIGHT],
  });

  const dataUrl = await urlToDataUrl(template.background_image);
  const imageFormat = detectImageFormat(dataUrl);

  doc.addImage(dataUrl, imageFormat, 0, 0, CERTIFICATE_CANVAS_WIDTH, CERTIFICATE_CANVAS_HEIGHT);
  doc.setFontSize(template.font_size || 28);

  const [r, g, b] = parseHexColorToRgb(template.font_color || "#000000");
  doc.setTextColor(r, g, b);
  const nx = Math.min(
    Math.max(0, template.name_x || 150),
    CERTIFICATE_CANVAS_WIDTH - 4
  );
  const ny = Math.min(
    Math.max(0, template.name_y || 150),
    CERTIFICATE_CANVAS_HEIGHT - 4
  );
  doc.text(recipientName || "Attendee", nx, ny);

  if (verificationText) {
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(verificationText, 20, CERTIFICATE_CANVAS_HEIGHT - 15);
  }

  const buffer = doc.output("arraybuffer");
  return Buffer.from(buffer);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function buildCertificateFingerprint(issue: CertificateIssueRow): string {
  const issuedAt = issue.issued_at || "";
  const regId = issue.registration_id ?? "";
  return sha256(
    `${issue.id}|${issue.event_id}|${issue.template_id}|${regId}|${issue.recipient_name}|${issue.recipient_email}|${issue.access_token}|${issuedAt}`
  );
}

function buildBlockHash(params: {
  blockIndex: number;
  previousHash: string | null;
  certificateHash: string;
  blockTimestamp: string;
}): string {
  const canonicalTimestamp = normalizeTimestampForHash(params.blockTimestamp);
  return sha256(
    `${params.blockIndex}|${params.previousHash || ""}|${params.certificateHash}|${canonicalTimestamp}`
  );
}

function normalizeTimestampForHash(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toISOString();
}

export async function getEventCertificateRecipients(
  supabase: SupabaseClient,
  eventId: number
): Promise<CertificateRecipient[]> {
  const { data, error } = await supabase
    .from("Registration")
    .select("id, status, has_checked_in, is_waitlisted, User(name, email)")
    .eq("event_id", eventId);

  if (error) {
    throw new Error(error.message);
  }

  const recipients: CertificateRecipient[] = [];
  const seen = new Set<string>();

  for (const row of (data || []) as any[]) {
    const status = String(row.status || "").toLowerCase();
    const isEligible = status === "confirmed" || !!row.has_checked_in;
    if (!isEligible || !!row.is_waitlisted) continue;

    const email = row.User?.email || "";
    if (!isValidEmail(email)) continue;

    const normalizedEmail = email.toLowerCase().trim();
    if (seen.has(normalizedEmail)) continue;
    seen.add(normalizedEmail);

    recipients.push({
      registrationId: Number.isNaN(Number(row.id)) ? null : Number(row.id),
      name: row.User?.name || "Attendee",
      email: normalizedEmail,
    });
  }

  return recipients;
}

export async function enqueueCertificateIssues(
  supabase: SupabaseClient,
  eventId: number,
  templateId: number,
  recipients: CertificateRecipient[],
  queueEmail: boolean
): Promise<number> {
  if (recipients.length === 0) return 0;

  const nowIso = new Date().toISOString();
  const rows = recipients.map((recipient) => ({
    event_id: eventId,
    template_id: templateId,
    registration_id: recipient.registrationId,
    recipient_name: recipient.name,
    recipient_email: recipient.email,
    access_token: randomUUID(),
    status: queueEmail ? "queued" : "issued",
    issued_at: nowIso,
    sent_at: null,
    error_message: null,
  }));

  const { error } = await supabase
    .from("CertificateIssue")
    .upsert(rows, { onConflict: "template_id,registration_id,recipient_email" });

  if (error) {
    throw new Error(error.message);
  }

  return rows.length;
}

export async function anchorCertificateIssuesToLedger(
  supabase: SupabaseClient,
  eventId: number,
  templateId: number,
  recipients: CertificateRecipient[]
): Promise<number> {
  if (recipients.length === 0) return 0;

  const recipientEmails = recipients.map((r) => r.email.toLowerCase().trim());
  const { data: issues, error: issuesError } = await supabase
    .from("CertificateIssue")
    .select(
      "id, event_id, template_id, registration_id, recipient_name, recipient_email, access_token, issued_at"
    )
    .eq("event_id", eventId)
    .eq("template_id", templateId)
    .in("recipient_email", recipientEmails);

  if (issuesError) throw new Error(issuesError.message);
  const issueRows = (issues || []) as CertificateIssueRow[];
  if (issueRows.length === 0) return 0;

  const issueIds = issueRows.map((i) => i.id);
  const { data: existingLedgerRows, error: existingError } = await supabase
    .from("CertificateLedger")
    .select("issue_id")
    .in("issue_id", issueIds);

  if (existingError) throw new Error(existingError.message);
  const existingIssueIds = new Set((existingLedgerRows || []).map((row: any) => Number(row.issue_id)));
  const pendingIssues = issueRows
    .filter((issue) => !existingIssueIds.has(issue.id))
    .sort((a, b) => a.id - b.id);

  if (pendingIssues.length === 0) return 0;

  const { data: latestBlock, error: latestError } = await supabase
    .from("CertificateLedger")
    .select("block_index, block_hash")
    .order("block_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) throw new Error(latestError.message);

  let nextIndex = Number(latestBlock?.block_index || 0);
  let previousHash: string | null = latestBlock?.block_hash || null;

  const rowsToInsert = pendingIssues.map((issue) => {
    nextIndex += 1;
    const blockTimestamp = new Date().toISOString();
    const certificateHash = buildCertificateFingerprint(issue);
    const blockHash = buildBlockHash({
      blockIndex: nextIndex,
      previousHash,
      certificateHash,
      blockTimestamp,
    });

    const row = {
      issue_id: issue.id,
      block_index: nextIndex,
      previous_hash: previousHash,
      certificate_hash: certificateHash,
      block_hash: blockHash,
      block_timestamp: blockTimestamp,
      payload: {
        event_id: issue.event_id,
        template_id: issue.template_id,
        recipient_email: issue.recipient_email,
        issued_at: issue.issued_at,
      },
    };

    previousHash = blockHash;
    return row;
  });

  const { error: insertError } = await supabase.from("CertificateLedger").insert(rowsToInsert);
  if (insertError) throw new Error(insertError.message);

  return rowsToInsert.length;
}

export async function verifyCertificateByToken(
  supabase: SupabaseClient,
  token: string
): Promise<{
  found: boolean;
  isValid: boolean;
  reason?: string;
  verification?: {
    issueId: number;
    blockIndex: number;
    certificateHash: string;
    blockHash: string;
    previousHash: string | null;
    blockTimestamp: string;
  };
}> {
  const { data: issue, error: issueError } = await supabase
    .from("CertificateIssue")
    .select(
      "id, event_id, template_id, registration_id, recipient_name, recipient_email, access_token, issued_at"
    )
    .eq("access_token", token)
    .maybeSingle();

  if (issueError) throw new Error(issueError.message);
  if (!issue) return { found: false, isValid: false, reason: "Certificate not found" };

  const issueRow = issue as CertificateIssueRow;
  const { data: ledger, error: ledgerError } = await supabase
    .from("CertificateLedger")
    .select("issue_id, block_index, previous_hash, certificate_hash, block_hash, block_timestamp")
    .eq("issue_id", issueRow.id)
    .maybeSingle();

  if (ledgerError) throw new Error(ledgerError.message);
  if (!ledger) {
    return { found: true, isValid: false, reason: "Certificate is not anchored to blockchain ledger" };
  }

  const expectedCertificateHash = buildCertificateFingerprint(issueRow);
  if (ledger.certificate_hash !== expectedCertificateHash) {
    return { found: true, isValid: false, reason: "Certificate payload hash mismatch" };
  }

  const expectedBlockHash = buildBlockHash({
    blockIndex: ledger.block_index,
    previousHash: ledger.previous_hash,
    certificateHash: ledger.certificate_hash,
    blockTimestamp: ledger.block_timestamp,
  });

  if (ledger.block_hash !== expectedBlockHash) {
    return { found: true, isValid: false, reason: "Block hash mismatch" };
  }

  if (ledger.block_index > 1) {
    const { data: previousBlock, error: previousError } = await supabase
      .from("CertificateLedger")
      .select("block_hash")
      .eq("block_index", ledger.block_index - 1)
      .maybeSingle();

    if (previousError) throw new Error(previousError.message);
    if (!previousBlock || previousBlock.block_hash !== ledger.previous_hash) {
      return { found: true, isValid: false, reason: "Broken hash chain link" };
    }
  }

  return {
    found: true,
    isValid: true,
    verification: {
      issueId: issueRow.id,
      blockIndex: ledger.block_index,
      certificateHash: ledger.certificate_hash,
      blockHash: ledger.block_hash,
      previousHash: ledger.previous_hash,
      blockTimestamp: ledger.block_timestamp,
    },
  };
}

export async function getCertificateLedgerMetaByToken(
  supabase: SupabaseClient,
  token: string
): Promise<{ blockHash: string; blockIndex: number; certificateHash: string } | null> {
  const { data: issue, error: issueError } = await supabase
    .from("CertificateIssue")
    .select("id")
    .eq("access_token", token)
    .maybeSingle();

  if (issueError) throw new Error(issueError.message);
  if (!issue) return null;

  const { data: ledger, error: ledgerError } = await supabase
    .from("CertificateLedger")
    .select("block_hash, block_index, certificate_hash")
    .eq("issue_id", issue.id)
    .maybeSingle();

  if (ledgerError) throw new Error(ledgerError.message);
  if (!ledger) return null;

  return {
    blockHash: ledger.block_hash,
    blockIndex: ledger.block_index,
    certificateHash: ledger.certificate_hash,
  };
}

export async function getCertificatePublicMetadata(
  supabase: SupabaseClient,
  token: string
): Promise<CertificatePublicView | null> {
  const { data: issue, error: issueError } = await supabase
    .from("CertificateIssue")
    .select("recipient_name, recipient_email, issued_at, event_id, template_id")
    .eq("access_token", token)
    .maybeSingle();

  if (issueError || !issue) return null;

  const row = issue as {
    recipient_name: string;
    recipient_email: string;
    issued_at: string | null;
    event_id: number;
    template_id: number;
  };

  const [{ data: ev }, { data: tmpl }] = await Promise.all([
    supabase.from("Event").select("title, event_start_at").eq("id", row.event_id).maybeSingle(),
    supabase
      .from("CertificateTemplate")
      .select("name, background_image, name_x, name_y, font_size, font_color")
      .eq("id", row.template_id)
      .maybeSingle(),
  ]);

  const ledgerMeta = await getCertificateLedgerMetaByToken(supabase, token);

  return {
    recipientName: row.recipient_name || "Attendee",
    recipientEmail: row.recipient_email || "",
    issuedAt: row.issued_at,
    eventTitle: (ev as { title?: string } | null)?.title?.trim() || "Event",
    eventStartAt: (ev as { event_start_at?: string | null } | null)?.event_start_at ?? null,
    templateName: (tmpl as { name?: string } | null)?.name?.trim() || "Certificate",
    backgroundImage: (tmpl as { background_image?: string } | null)?.background_image || "",
    namePlaced: {
      x: Number((tmpl as { name_x?: number } | null)?.name_x ?? 150),
      y: Number((tmpl as { name_y?: number } | null)?.name_y ?? 150),
      fontSize: Number((tmpl as { font_size?: number } | null)?.font_size ?? 28),
      fontColor: String((tmpl as { font_color?: string } | null)?.font_color ?? "#000000"),
    },
    ledgerAnchored: !!ledgerMeta,
    ledgerPreview: ledgerMeta
      ? {
          blockIndex: ledgerMeta.blockIndex,
          blockHashShort: ledgerMeta.blockHash.slice(0, 16),
          certificateHashShort: ledgerMeta.certificateHash.slice(0, 16),
        }
      : undefined,
  };
}

export async function processQueuedCertificateEmails(
  supabase: SupabaseClient,
  origin: string,
  options?: { eventId?: number; limit?: number }
): Promise<{ processed: number; sent: number; failed: number }> {
  const limit = options?.limit ?? 30;

  let query = supabase
    .from("CertificateIssue")
    .select("id, event_id, recipient_name, recipient_email, access_token")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (options?.eventId) {
    query = query.eq("event_id", options.eventId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const issues = (data || []) as Array<{
    id: number;
    event_id: number;
    recipient_name: string;
    recipient_email: string;
    access_token: string;
  }>;

  let sent = 0;
  let failed = 0;

  for (const issue of issues) {
    try {
      const viewUrl = `${origin.replace(/\/$/, "")}/certificates/${issue.access_token}`;
      const downloadUrl = `${origin.replace(/\/$/, "")}/api/certificates/${issue.access_token}/download`;
      const verifyUrl = `${origin.replace(/\/$/, "")}/api/certificates/${issue.access_token}/verify`;
      const safeRecipientName = escapeHtml(issue.recipient_name || "Attendee");
      const safeViewUrl = escapeHtml(viewUrl);
      const safeDownloadUrl = escapeHtml(downloadUrl);
      const safeVerifyUrl = escapeHtml(verifyUrl);

      await sendEmail({
        to: issue.recipient_email,
        subject: "Your event certificate is ready",
        html: `
          <p>Hi ${safeRecipientName},</p>
          <p>Your certificate is ready. Open your certificate page to preview it and download the PDF.</p>
          <p><a href="${safeViewUrl}" style="font-weight:bold">View certificate</a></p>
          <p style="margin-top:1em;font-size:14px">Or <a href="${safeDownloadUrl}">download PDF directly</a>.</p>
          <p style="margin-top:1em;font-size:13px;color:#555">Verification (API): <a href="${safeVerifyUrl}">${safeVerifyUrl}</a></p>
        `,
      });

      sent += 1;
      await supabase
        .from("CertificateIssue")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", issue.id);
    } catch (e) {
      failed += 1;
      await supabase
        .from("CertificateIssue")
        .update({
          status: "failed",
          error_message: e instanceof Error ? e.message : "Certificate email sending failed",
        })
        .eq("id", issue.id);
    }
  }

  return { processed: issues.length, sent, failed };
}
