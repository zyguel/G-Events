import nodemailer from "nodemailer";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_FROM_NAME = "G Events";

type EmailProvider = "auto" | "smtp" | "resend";

const HTML_URL_ATTR_REGEX = /(src|href)=("|')([^"']+)(\2)/gi;

function getAppOrigin(): string | null {
  const configured = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!configured) {
    return null;
  }

  try {
    return new URL(configured).origin;
  } catch {
    return null;
  }
}

function absolutizeEmailHtmlUrls(html: string): string {
  const appOrigin = getAppOrigin();
  if (!appOrigin) {
    return html;
  }

  return html.replace(HTML_URL_ATTR_REGEX, (full, attr, quote, url) => {
    const trimmedUrl = String(url).trim();

    if (!trimmedUrl) {
      return full;
    }

    if (
      trimmedUrl.startsWith("http://") ||
      trimmedUrl.startsWith("https://") ||
      trimmedUrl.startsWith("data:") ||
      trimmedUrl.startsWith("cid:") ||
      trimmedUrl.startsWith("mailto:") ||
      trimmedUrl.startsWith("tel:") ||
      trimmedUrl.startsWith("#")
    ) {
      return full;
    }

    if (trimmedUrl.startsWith("//")) {
      return `${attr}=${quote}https:${trimmedUrl}${quote}`;
    }

    const path = trimmedUrl.startsWith("/") ? trimmedUrl : `/${trimmedUrl}`;
    return `${attr}=${quote}${appOrigin}${path}${quote}`;
  });
}

function parseOptionalBoolean(value: string | undefined): boolean | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }

  return undefined;
}

function getConfiguredProvider(): EmailProvider {
  const rawProvider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (!rawProvider || rawProvider === "auto") {
    return "auto";
  }

  if (rawProvider === "smtp" || rawProvider === "resend") {
    return rawProvider;
  }

  throw new Error("EMAIL_PROVIDER must be one of: auto, smtp, resend");
}

function hasSmtpConfiguration(): boolean {
  const smtpUrl = process.env.SMTP_URL;
  if (smtpUrl) {
    return true;
  }

  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getRequiredSmtpFromAddress(): string {
  const from = process.env.SMTP_FROM_EMAIL;
  if (!from) {
    throw new Error("SMTP_FROM_EMAIL is not configured");
  }

  return formatFromAddress(from);
}

function formatFromAddress(from: string): string {
  const trimmed = from.trim();
  if (!trimmed) {
    return trimmed;
  }

  // Keep explicit display-name formats untouched.
  if (trimmed.includes("<") && trimmed.includes(">")) {
    return trimmed;
  }

  return `"${DEFAULT_FROM_NAME}" <${trimmed}>`;
}

async function sendWithResend({ to, subject, html }: SendEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const rawFrom = process.env.RESEND_FROM_EMAIL;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  if (!rawFrom) {
    throw new Error("RESEND_FROM_EMAIL is not configured");
  }

  const from = formatFromAddress(rawFrom);
  const normalizedHtml = absolutizeEmailHtmlUrls(html);

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html: normalizedHtml,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Email provider error (${response.status}): ${text}`);
  }
}

async function sendWithSmtp({ to, subject, html }: SendEmailParams): Promise<void> {
  const from = getRequiredSmtpFromAddress();
  const normalizedHtml = absolutizeEmailHtmlUrls(html);
  const smtpUrl = process.env.SMTP_URL;
  const smtpService = process.env.SMTP_SERVICE;

  const transport = smtpUrl
    ? nodemailer.createTransport(smtpUrl)
    : (() => {
        const smtpHost = process.env.SMTP_HOST;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (!smtpHost) {
          throw new Error("SMTP_HOST is not configured");
        }

        if (!smtpUser) {
          throw new Error("SMTP_USER is not configured");
        }

        if (!smtpPass) {
          throw new Error("SMTP_PASS is not configured");
        }

        const parsedPort = Number.parseInt(process.env.SMTP_PORT ?? "587", 10);
        if (!Number.isFinite(parsedPort) || parsedPort <= 0) {
          throw new Error("SMTP_PORT must be a valid positive number");
        }

        const secureOverride = parseOptionalBoolean(process.env.SMTP_SECURE);
        const secure = secureOverride ?? parsedPort === 465;

        return nodemailer.createTransport({
          host: smtpHost,
          port: parsedPort,
          secure,
          service: smtpService,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
      })();

  await transport.sendMail({
    from,
    to,
    subject,
    html: normalizedHtml,
  });
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  const provider = getConfiguredProvider();

  if (provider === "smtp") {
    await sendWithSmtp({ to, subject, html });
    return;
  }

  if (provider === "resend") {
    await sendWithResend({ to, subject, html });
    return;
  }

  if (hasSmtpConfiguration()) {
    await sendWithSmtp({ to, subject, html });
    return;
  }

  await sendWithResend({ to, subject, html });
}
