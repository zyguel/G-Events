'use client';

import { useState, useCallback, useRef } from 'react';
import {
  QrCode,
  Keyboard,
  X,
  User,
  Mail,
  Ticket,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { CheckInQrScanner } from '@/components/admin/checkin/CheckInQrScanner';

type ScanMode = 'all' | 'main_only' | 'breakout_only';

type ScanJson = {
  success: true;
  token: string;
  kind: 'main' | 'breakout';
  participant: { name: string; email: string; registrationId: string };
  ticketType: string;
  registrationStatus: string;
  mainEventCheckedIn: boolean;
  mainEventStatus: string;
  breakout: null | {
    breakoutRegistrationId: number;
    sessionId: number;
    title: string;
    location: string;
    checkedIn: boolean;
    checkInTime: string | null;
  };
};

export function CheckInScanPanel({
  eventId,
  onAttendanceChanged,
}: {
  eventId: string;
  onAttendanceChanged: () => Promise<void>;
}) {
  const [scannerOn, setScannerOn] = useState(true);
  const [scanMode, setScanMode] = useState<ScanMode>('all');
  const [manual, setManual] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanJson | null>(null);
  const [lastRaw, setLastRaw] = useState('');
  const lastCameraScanAt = useRef(0);

  const resolveScan = useCallback(
    async (raw: string) => {
      setScanLoading(true);
      setScanError(null);
      try {
        const res = await fetch(`/api/events/${eventId}/checkin/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw }),
        });
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error || 'Lookup failed');
        const parsed = json as ScanJson;
        if (scanMode === 'breakout_only' && parsed.kind === 'main') {
          setScanResult(null);
          setLastRaw('');
          throw new Error(
            "Breakout-only mode: scan the attendee's breakout QR (from their breakout e-ticket), not the main event ticket."
          );
        }
        if (scanMode === 'main_only' && parsed.kind === 'breakout') {
          setScanResult(null);
          setLastRaw('');
          throw new Error(
            'Main-event mode: scan the main event ticket QR. Switch to “All” or “Breakout only” for breakout check-in.'
          );
        }
        setScanResult(parsed);
        setLastRaw(raw);
      } catch (e) {
        setScanResult(null);
        setLastRaw('');
        setScanError(e instanceof Error ? e.message : 'Scan failed');
      } finally {
        setScanLoading(false);
      }
    },
    [eventId, scanMode]
  );

  const onDecoded = useCallback(
    (text: string) => {
      const now = Date.now();
      if (now - lastCameraScanAt.current < 1500) return;
      lastCameraScanAt.current = now;
      void resolveScan(text);
    },
    [resolveScan]
  );

  const apply = useCallback(async () => {
    if (!lastRaw) return;
    setApplyLoading(true);
    setScanError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/checkin/scan/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: lastRaw }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Check-in failed');

      await onAttendanceChanged();

      if (json.alreadyCheckedIn) {
        setScanResult((prev) => {
          if (!prev) return prev;
          if (prev.kind === 'main') {
            return {
              ...prev,
              mainEventCheckedIn: true,
              mainEventStatus: 'Checked-In',
            };
          }
          if (prev.kind === 'breakout' && prev.breakout) {
            return {
              ...prev,
              breakout: {
                ...prev.breakout,
                checkedIn: true,
                checkInTime: prev.breakout.checkInTime || new Date().toLocaleString(),
              },
            };
          }
          return prev;
        });
        return;
      }

      setScanResult((prev) => {
        if (!prev) return prev;
        if (json.kind === 'main') {
          return {
            ...prev,
            mainEventCheckedIn: true,
            mainEventStatus: 'Checked-In',
          };
        }
        if (prev.kind === 'breakout' && prev.breakout) {
          return {
            ...prev,
            breakout: {
              ...prev.breakout,
              checkedIn: true,
              checkInTime: json.checkInTime || new Date().toLocaleString(),
            },
          };
        }
        return prev;
      });
    } catch (e) {
      setScanError(e instanceof Error ? e.message : 'Check-in failed');
    } finally {
      setApplyLoading(false);
    }
  }, [eventId, lastRaw, onAttendanceChanged]);

  const dismiss = () => {
    lastCameraScanAt.current = 0;
    setScanResult(null);
    setLastRaw('');
    setScanError(null);
    setManual('');
  };

  const canCheckIn =
    scanResult &&
    ((scanResult.kind === 'main' && !scanResult.mainEventCheckedIn) ||
      (scanResult.kind === 'breakout' && scanResult.breakout && !scanResult.breakout.checkedIn));

  const alreadyCheckedInForTarget =
    scanResult &&
    !canCheckIn &&
    ((scanResult.kind === 'main' && scanResult.mainEventCheckedIn) ||
      (scanResult.kind === 'breakout' && scanResult.breakout?.checkedIn));

  const cameraActive = scannerOn && !scanResult && !scanLoading;

  return (
    <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-4 sm:px-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-[#3D518C]/10 to-indigo-500/10 dark:from-[#3D518C]/20 dark:to-indigo-900/20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-[#3D518C] flex items-center justify-center shadow-md shrink-0">
            <QrCode className="text-white w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Scan tickets</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Main event & breakout QR — point camera or paste code
            </p>
            <div
              className="mt-2 flex flex-wrap gap-1.5"
              role="group"
              aria-label="Scan mode"
            >
              {(
                [
                  ['all', 'All tickets'],
                  ['main_only', 'Main only'],
                  ['breakout_only', 'Breakout only'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setScanMode(value);
                    dismiss();
                  }}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition ${
                    scanMode === value
                      ? 'bg-[#3D518C] text-white shadow'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setScannerOn((v) => !v)}
          className="shrink-0 text-sm font-semibold px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 min-h-[44px]"
        >
          {scannerOn ? 'Hide camera' : 'Show camera'}
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        <CheckInQrScanner active={cameraActive} onScan={onDecoded} />

        {scanLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 className="animate-spin" size={16} />
            Reading ticket…
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-900/40 px-3 py-2 min-h-[48px]">
            <Keyboard size={18} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && manual.trim() && !scanLoading) {
                  void resolveScan(manual);
                }
              }}
              placeholder="Paste ticket URL or token"
              className="flex-1 min-w-0 bg-transparent text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400"
            />
          </div>
          <button
            type="button"
            disabled={!manual.trim() || scanLoading}
            onClick={() => void resolveScan(manual)}
            className="min-h-[48px] px-5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-bold disabled:opacity-40"
          >
            Lookup
          </button>
        </div>

        {scanError && (
          <div className="flex gap-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            {scanError}
          </div>
        )}

        {scanResult && (
          <div className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                {scanResult.kind === 'main' ? 'Main event ticket' : 'Breakout ticket'}
              </p>
              <button
                type="button"
                onClick={dismiss}
                className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 -m-2"
                aria-label="Dismiss"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <User size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white break-words">
                    {scanResult.participant.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5 break-all">
                    <Mail size={12} className="shrink-0" />
                    {scanResult.participant.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/80 dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                  <Ticket size={12} />
                  {scanResult.ticketType}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-lg bg-white/80 dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                  Reg #{scanResult.participant.registrationId}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-lg bg-white/80 dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                  {scanResult.registrationStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-indigo-100 dark:border-indigo-900/50">
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Main event</p>
                  <p
                    className={`text-sm font-semibold ${scanResult.mainEventCheckedIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
                  >
                    {scanResult.mainEventStatus}
                  </p>
                </div>
                {scanResult.kind === 'breakout' && scanResult.breakout && (
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400">Breakout session</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {scanResult.breakout.title}
                    </p>
                    {scanResult.breakout.location ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} />
                        {scanResult.breakout.location}
                      </p>
                    ) : null}
                    <p
                      className={`text-xs font-semibold mt-1 ${scanResult.breakout.checkedIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
                    >
                      {scanResult.breakout.checkedIn
                        ? `Breakout checked in${scanResult.breakout.checkInTime ? ` · ${scanResult.breakout.checkInTime}` : ''}`
                        : 'Breakout not checked in yet'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              {canCheckIn ? (
                <button
                  type="button"
                  disabled={applyLoading}
                  onClick={() => void apply()}
                  className="flex-1 min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {applyLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                  {scanResult.kind === 'main' ? 'Check in — main event' : 'Check in — breakout'}
                </button>
              ) : alreadyCheckedInForTarget ? (
                <div className="flex-1 min-h-[48px] rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-900/20 flex items-center justify-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-200 px-3 text-center">
                  <CheckCircle2 size={18} className="shrink-0" />
                  Already checked in for this ticket
                </div>
              ) : null}
              <button
                type="button"
                onClick={dismiss}
                className="min-h-[48px] px-5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200"
              >
                Scan next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
