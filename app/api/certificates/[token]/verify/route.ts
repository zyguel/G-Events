import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyCertificateByToken } from "@/lib/certificates";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderVerificationHtml(params: {
  token: string;
  verified: boolean;
  reason: string | null;
  blockchain:
    | {
        issueId: number;
        blockIndex: number;
        certificateHash: string;
        blockHash: string;
        previousHash: string | null;
        blockTimestamp: string;
        payload?: Record<string, unknown>;
      }
    | null;
  includePayload: boolean;
}): string {
  const statusColor = params.verified ? "#16a34a" : "#d97706";
  const statusLabel = params.verified ? "Ledger verification passed" : "Not verified on ledger";
  const reason = params.reason ? `<p class=\"reason\">${escapeHtml(params.reason)}</p>` : "";
  const payloadText =
    params.includePayload && params.blockchain?.payload
      ? JSON.stringify(params.blockchain.payload, null, 2)
      : "";

  const details = params.blockchain
    ? `
      <div class=\"card\">
        <h2>Blockchain details</h2>
        <dl>
          <dt>Issue ID</dt><dd>${params.blockchain.issueId}</dd>
          <dt>Block Index</dt><dd>${params.blockchain.blockIndex}</dd>
          <dt>Block Timestamp</dt><dd>${escapeHtml(params.blockchain.blockTimestamp)}</dd>
          <dt>Certificate Hash</dt><dd class=\"mono\">${escapeHtml(params.blockchain.certificateHash)}</dd>
          <dt>Block Hash</dt><dd class=\"mono\">${escapeHtml(params.blockchain.blockHash)}</dd>
          <dt>Previous Hash</dt><dd class=\"mono\">${escapeHtml(params.blockchain.previousHash ?? "-")}</dd>
        </dl>
      </div>
      ${
        params.includePayload
          ? `<div class=\"card\"><h2>Optional payload details</h2><pre>${escapeHtml(payloadText || "No payload found")}</pre></div>`
          : `<div class=\"card\"><h2>Optional payload details</h2><p>Append <span class=\"mono\">?includePayload=1</span> to view stored payload details.</p></div>`
      }
    `
    : "";

  return `<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>Certificate Verification</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; background: radial-gradient(circle at 15% 15%, #dbeafe, transparent 35%), radial-gradient(circle at 85% 80%, #e0e7ff, transparent 35%), #f8fafc; color: #0f172a; }
    .wrap { max-width: 900px; margin: 0 auto; padding: 32px 16px 56px; }
    .head { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08); }
    .status { display: inline-block; border-radius: 999px; padding: 6px 12px; font-weight: 700; background: ${statusColor}1a; color: ${statusColor}; }
    .reason { margin: 12px 0 0; color: #475569; }
    .meta { margin-top: 14px; color: #64748b; font-size: 14px; }
    .grid { margin-top: 16px; display: grid; gap: 14px; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05); }
    h1 { margin: 8px 0 0; font-size: 28px; }
    h2 { margin: 0 0 12px; font-size: 16px; }
    dl { margin: 0; display: grid; grid-template-columns: 180px 1fr; gap: 8px 14px; }
    dt { color: #475569; }
    dd { margin: 0; font-weight: 600; overflow-wrap: anywhere; }
    pre { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 10px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .links { margin-top: 16px; display: flex; gap: 12px; flex-wrap: wrap; }
    a { color: #1d4ed8; text-decoration: none; }
    a:hover { text-decoration: underline; }
    @media (max-width: 700px) { dl { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main class=\"wrap\">
    <section class=\"head\">
      <span class=\"status\">${statusLabel}</span>
      <h1>Certificate Verification</h1>
      ${reason}
      <p class=\"meta\">Token: <span class=\"mono\">${escapeHtml(params.token)}</span></p>
      <div class=\"links\">
        <a href=\"?format=json\">View JSON response</a>
        <a href=\"?includePayload=1\">Show optional payload details</a>
      </div>
    </section>
    <section class=\"grid\">
      ${details || `<div class=\"card\"><p>No blockchain details available for this token.</p></div>`}
    </section>
  </main>
</body>
</html>`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const format = request.nextUrl.searchParams.get("format");
    const includePayload = request.nextUrl.searchParams.get("includePayload") === "1";
    const isDocumentRequest = request.headers.get("sec-fetch-dest") === "document";
    const wantsHtml = format === "html" || (format !== "json" && isDocumentRequest);

    if (!token) {
      if (wantsHtml) {
        return new NextResponse(renderVerificationHtml({
          token,
          verified: false,
          reason: "Invalid token",
          blockchain: null,
          includePayload,
        }), {
          status: 400,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const result = await verifyCertificateByToken(supabase, token, { includePayload });

    if (!result.found) {
      if (wantsHtml) {
        return new NextResponse(renderVerificationHtml({
          token,
          verified: false,
          reason: result.reason || "Certificate not found",
          blockchain: null,
          includePayload,
        }), {
          status: 404,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
      return NextResponse.json(
        { success: false, verified: false, error: result.reason || "Certificate not found" },
        { status: 404 }
      );
    }

    if (wantsHtml) {
      return new NextResponse(
        renderVerificationHtml({
          token,
          verified: result.isValid,
          reason: result.reason || null,
          blockchain: result.verification || null,
          includePayload,
        }),
        { headers: { "content-type": "text/html; charset=utf-8" } }
      );
    }

    return NextResponse.json({
      success: true,
      verified: result.isValid,
      reason: result.reason || null,
      blockchain: result.verification || null,
    });
  } catch (e) {
    const format = request.nextUrl.searchParams.get("format");
    const isDocumentRequest = request.headers.get("sec-fetch-dest") === "document";
    const wantsHtml = format === "html" || (format !== "json" && isDocumentRequest);
    const message = e instanceof Error ? e.message : "Unexpected verification error";

    if (wantsHtml) {
      const { token } = await params;
      return new NextResponse(
        renderVerificationHtml({
          token,
          verified: false,
          reason: message,
          blockchain: null,
          includePayload: request.nextUrl.searchParams.get("includePayload") === "1",
        }),
        { status: 500, headers: { "content-type": "text/html; charset=utf-8" } }
      );
    }

    return NextResponse.json(
      { success: false, verified: false, error: message },
      { status: 500 }
    );
  }
}
