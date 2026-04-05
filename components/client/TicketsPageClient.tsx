"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, CheckCircle2, Copy, MapPin, QrCode, Ticket, Clock } from "lucide-react";
import { buildEventSlug } from "@/lib/slug";

export type TicketPassItem = {
  registrationId: number;
  eventId: number;
  eventTitle: string;
  eventLocation: string | null;
  eventBannerImage: string | null;
  eventStartAt: string | null;
  eventEndAt: string | null;
  ticketName: string;
  ticketPrice: number | null;
  status: string;
  hasCheckedIn: boolean;
  checkedInAt: string | null;
  createdAt: string | null;
  passEmail: string;
  token: string;
  qrPayload: string;
  expiresAt: string;
};

function formatDateTime(isoValue: string | null): string {
  if (!isoValue) return "TBD";
  return new Date(isoValue).toLocaleString();
}

function formatPrice(price: number | null): string {
  if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
    return "Free";
  }

  return `PHP ${Number(price).toLocaleString()}`;
}

function TicketPassCard({ pass }: { pass: TicketPassItem }) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    let active = true;

    const generateQr = async () => {
      try {
        const qrcode = await import("qrcode");
        const dataUrl = await qrcode.toDataURL(pass.qrPayload, {
          width: 260,
          margin: 1,
          errorCorrectionLevel: "M",
        });

        if (active) {
          setQrDataUrl(dataUrl);
        }
      } catch {
        if (active) {
          setQrDataUrl("");
        }
      }
    };

    generateQr();

    return () => {
      active = false;
    };
  }, [pass.qrPayload]);

  const eventHref = useMemo(() => `/events/${buildEventSlug(pass.eventTitle, pass.eventId)}`, [pass.eventId, pass.eventTitle]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pass.qrPayload);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }

    window.setTimeout(() => setCopyState("idle"), 1800);
  };

  return (
    <article className="bg-white dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
      <div className="p-5 md:p-6 border-b border-gray-100 dark:border-gray-800 bg-linear-to-r from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-900/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{pass.ticketName}</p>
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mt-1">{pass.eventTitle}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatPrice(pass.ticketPrice)}</p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              pass.hasCheckedIn
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-300 dark:border-emerald-700/40"
                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-300 dark:border-amber-700/40"
            }`}
          >
            <CheckCircle2 size={12} />
            {pass.hasCheckedIn ? "Checked In" : "Active"}
          </span>
        </div>
      </div>

      <div className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Calendar size={15} className="text-blue-500" />
            <span>{formatDateTime(pass.eventStartAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Clock size={15} className="text-indigo-500" />
            <span>{pass.eventEndAt ? `Ends ${formatDateTime(pass.eventEndAt)}` : "End time TBD"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <MapPin size={15} className="text-rose-500" />
            <span>{pass.eventLocation || "Location TBD"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Ticket size={15} className="text-violet-500" />
            <span>Registration #{pass.registrationId}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">QR pass expires: {formatDateTime(pass.expiresAt)}</p>
          {pass.checkedInAt && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Checked in at: {formatDateTime(pass.checkedInAt)}</p>
          )}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Copy size={13} />
              {copyState === "copied" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy QR data"}
            </button>
            <Link
              href={eventHref}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-700/50 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/25 transition-colors"
            >
              View event
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-4 flex items-center justify-center min-h-60">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`Ticket QR for ${pass.eventTitle}`} className="w-56 h-56" />
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <QrCode size={14} />
              Generating QR...
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function TicketsPageClient({ passes }: { passes: TicketPassItem[] }) {
  return (
    <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">My Tickets</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your event passes and present your QR code during check-in.</p>
      </div>

      {passes.length === 0 ? (
        <section className="bg-white dark:bg-gray-900/70 border border-dashed border-gray-300 dark:border-gray-700 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 mx-auto flex items-center justify-center mb-5">
            <Ticket size={28} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">No tickets yet</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Register for an event first to see your ticket QR passes here.</p>
          <Link
            href="/home"
            className="inline-flex mt-6 px-5 py-2.5 rounded-xl bg-[#3D518C] text-white text-sm font-semibold hover:bg-[#33467a] transition-colors"
          >
            Browse events
          </Link>
        </section>
      ) : (
        <section className="space-y-5">
          {passes.map((pass) => (
            <TicketPassCard key={`${pass.eventId}-${pass.registrationId}`} pass={pass} />
          ))}
        </section>
      )}
    </main>
  );
}
