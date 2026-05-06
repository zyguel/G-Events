"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Award,
  Calendar,
  Download,
  Loader2,
  Mail,
  ShieldCheck,
  ShieldOff,
  User,
} from "lucide-react";
import type { CertificatePublicView } from "@/lib/certificateLayout";
import {
  CERTIFICATE_CANVAS_HEIGHT,
  CERTIFICATE_CANVAS_WIDTH,
} from "@/lib/certificateLayout";

type VerifyState =
  | { loading: true }
  | { loading: false; verified: boolean; reason?: string | null };

export default function CertificateView({ token }: { token: string }) {
  const [data, setData] = useState<CertificatePublicView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verify, setVerify] = useState<VerifyState>({ loading: true });
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewW, setPreviewW] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/certificates/${token}/meta`);
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !json?.success) {
          setError(json?.error || "Certificate not found");
          setData(null);
        } else {
          setData(json.data as CertificatePublicView);
        }
      } catch {
        if (!cancelled) setError("Could not load certificate");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/certificates/${token}/verify`);
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        setVerify({
          loading: false,
          verified: !!json?.verified,
          reason: json?.reason ?? null,
        });
      } catch {
        if (!cancelled) {
          setVerify({
            loading: false,
            verified: false,
            reason: "Verification request failed",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const resizePreview = useCallback(() => {
    const el = previewRef.current;
    if (!el) return;
    setPreviewW(el.getBoundingClientRect().width);
  }, []);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    resizePreview();
    const ro = new ResizeObserver(() => resizePreview());
    ro.observe(el);
    return () => ro.disconnect();
  }, [data?.backgroundImage, resizePreview]);

  const issuedLabel = useMemo(() => {
    if (!data?.issuedAt) return null;
    try {
      return new Date(data.issuedAt).toLocaleString(undefined, {
        dateStyle: "long",
        timeStyle: "short",
      });
    } catch {
      return data.issuedAt;
    }
  }, [data?.issuedAt]);

  const eventDateLabel = useMemo(() => {
    if (!data?.eventStartAt) return null;
    try {
      return new Date(data.eventStartAt).toLocaleDateString(undefined, {
        dateStyle: "long",
      });
    } catch {
      return data.eventStartAt;
    }
  }, [data?.eventStartAt]);

  const displayFontSize =
    previewW > 0
      ? Math.max(
          10,
          (data?.namePlaced.fontSize ?? 28) * (previewW / CERTIFICATE_CANVAS_WIDTH)
        )
      : data?.namePlaced.fontSize ?? 28;

  const downloadHref = `/api/certificates/${token}/download`;

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-[#F4F7FC] px-4 dark:bg-[#0f111a]">
        <Loader2 className="h-10 w-10 animate-spin text-[#3D518C] dark:text-blue-400" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading certificate…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-[#F4F7FC] px-6 text-center dark:bg-[#0f111a]">
        <ShieldOff className="h-12 w-12 text-gray-300 dark:text-gray-600" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Certificate unavailable</h1>
        <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <Link
          href="/home"
          className="mt-2 rounded-xl bg-[#3D518C] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#324373]"
        >
          Back to home
        </Link>
      </div>
    );
  }

  const bg = data.backgroundImage;
  const isRemoteBg = bg.startsWith("http://") || bg.startsWith("https://");

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-gray-900 dark:bg-[#0f111a] dark:text-gray-100">
      <div className="pointer-events-none fixed left-[-20%] top-[-10%] h-[420px] w-[420px] rounded-full bg-blue-400/15 blur-[80px] dark:bg-blue-600/10" />
      <div className="pointer-events-none fixed bottom-[-15%] right-[-10%] h-[480px] w-[480px] rounded-full bg-indigo-400/15 blur-[90px] dark:bg-purple-600/10" />

      <main className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <div className="mb-8 flex flex-col items-center text-center sm:mb-10">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] shadow-lg shadow-blue-500/20">
            <Award className="h-7 w-7 text-white" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3D518C] dark:text-blue-400">
            Electronic certificate
          </p>
          <h1 className="mt-2 text-pretty text-2xl font-extrabold tracking-tight sm:text-3xl">
            {data.templateName}
          </h1>
          <p className="mt-1 max-w-lg text-sm text-gray-500 dark:text-gray-400">{data.eventTitle}</p>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-gray-200/80 bg-white/90 p-5 shadow-lg shadow-gray-200/40 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/85 dark:shadow-black/20 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
                    <User className="h-5 w-5 text-[#3D518C] dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Presented to
                    </p>
                    <p className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                      {data.recipientName}
                    </p>
                  </div>
                </div>

                {data.recipientEmail ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                    <span className="break-all">{data.recipientEmail}</span>
                  </div>
                ) : null}

                <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300 sm:flex-row sm:flex-wrap sm:gap-x-6">
                  {eventDateLabel ? (
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0 text-indigo-500" />
                      Event date: <strong className="font-semibold text-gray-900 dark:text-white">{eventDateLabel}</strong>
                    </span>
                  ) : null}
                  {issuedLabel ? (
                    <span className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      Issued: {issuedLabel}
                    </span>
                  ) : null}
                </div>
              </div>

              <a
                href={downloadHref}
                className="inline-flex min-h-[48px] w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] px-6 py-3.5 text-[15px] font-bold text-white shadow-md transition hover:shadow-lg active:scale-[0.98] sm:w-auto touch-manipulation"
              >
                <Download className="h-5 w-5" />
                Download PDF
              </a>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200/80 bg-white/90 p-5 dark:border-gray-800 dark:bg-gray-900/85 sm:p-7">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Preview
            </h2>
            <div
              ref={previewRef}
              className="relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
              style={{ aspectRatio: `${CERTIFICATE_CANVAS_WIDTH} / ${CERTIFICATE_CANVAS_HEIGHT}` }}
            >
              {bg ? (
                isRemoteBg ? (
                  <Image
                    src={bg}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 720px"
                    unoptimized
                    priority
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- data URLs from template
                  <img src={bg} alt="" className="h-full w-full object-cover" loading="eager" />
                )
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                  No background image
                </div>
              )}
              <div
                className="pointer-events-none absolute max-w-[95%] break-words px-1 font-bold leading-tight"
                style={{
                  left: `${(data.namePlaced.x / CERTIFICATE_CANVAS_WIDTH) * 100}%`,
                  top: `${(data.namePlaced.y / CERTIFICATE_CANVAS_HEIGHT) * 100}%`,
                  fontSize: `${displayFontSize}px`,
                  color: data.namePlaced.fontColor,
                  transform: "translateY(-50%)",
                }}
              >
                {data.recipientName}
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
              PDF matches this layout. Name position uses the same coordinates as the issued file.
            </p>
          </section>

          <section className="rounded-3xl border border-gray-200/80 bg-white/90 p-5 dark:border-gray-800 dark:bg-gray-900/85 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {verify.loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                ) : verify.verified ? (
                  <ShieldCheck className="h-8 w-8 shrink-0 text-emerald-500" />
                ) : (
                  <ShieldOff className="h-8 w-8 shrink-0 text-amber-500" />
                )}
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {verify.loading
                      ? "Checking verification…"
                      : verify.verified
                        ? "Ledger verification passed"
                        : "Not verified on ledger"}
                  </p>
                  {!verify.loading && !verify.verified && verify.reason ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{verify.reason}</p>
                  ) : null}
                </div>
              </div>
              {data.ledgerAnchored && data.ledgerPreview ? (
                <div className="rounded-xl bg-gray-50 px-3 py-2 font-mono text-[11px] text-gray-600 dark:bg-gray-800/80 dark:text-gray-300">
                  <div>Block #{data.ledgerPreview.blockIndex}</div>
                  <div className="truncate">Hash {data.ledgerPreview.certificateHashShort}…</div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">No blockchain anchor for this issue.</p>
              )}
            </div>
          </section>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            <Link href="/home" className="font-semibold text-[#3D518C] hover:underline dark:text-blue-400">
              Back to home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
