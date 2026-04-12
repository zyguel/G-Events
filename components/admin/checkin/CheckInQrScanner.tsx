'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CameraOff, Loader2 } from 'lucide-react';

type Props = {
  /** When false, camera is stopped */
  active: boolean;
  onScan: (text: string) => void;
  onCameraError?: (message: string) => void;
};

export function CheckInQrScanner({ active, onScan, onCameraError }: Props) {
  const [regionId] = useState(
    () =>
      `admin-checkin-qr-${
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)
      }`
  );

  const scannerRef = useRef<Html5Qrcode | null>(null);
  /** Serialize stop/start so React Strict Mode (or fast remounts) never run two cameras at once. */
  const cameraChainRef = useRef(Promise.resolve());

  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const [phase, setPhase] = useState<'idle' | 'starting' | 'running' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const stopScanner = useCallback(async () => {
    const next = cameraChainRef.current.then(async () => {
      const s = scannerRef.current;
      scannerRef.current = null;
      if (!s) return;
      try {
        await s.stop();
      } catch {
        /* already stopped */
      }
      try {
        s.clear();
      } catch {
        /* */
      }
    });
    cameraChainRef.current = next;
    await next;
  }, []);

  useEffect(() => {
    if (!active) {
      void stopScanner();
      setPhase('idle');
      return;
    }

    let cancelled = false;

    const run = async () => {
      await stopScanner();
      if (cancelled) return;

      setPhase('starting');
      setErrMsg(null);

      try {
        const html5Qr = new Html5Qrcode(regionId, /* verbose */ false);
        scannerRef.current = html5Qr;
        await html5Qr.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 260, height: 260 },
          },
          (decodedText) => {
            onScanRef.current(decodedText);
          },
          () => {
            /* frame with no QR — ignore */
          }
        );
        if (cancelled) {
          try {
            await html5Qr.stop();
          } catch {
            /* */
          }
          try {
            html5Qr.clear();
          } catch {
            /* */
          }
          scannerRef.current = null;
          return;
        }
        setPhase('running');
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Camera unavailable';
        scannerRef.current = null;
        if (!cancelled) {
          setPhase('error');
          setErrMsg(msg);
          onCameraError?.(msg);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      void stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- regionId is stable for component lifetime
  }, [active, stopScanner, onCameraError]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-gray-600 dark:border-gray-600">
      {phase === 'starting' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/80 text-white">
          <Loader2 className="animate-spin" size={28} />
          <span className="text-sm font-medium">Starting camera…</span>
        </div>
      )}
      {phase === 'error' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-zinc-900 p-4 text-center text-amber-100">
          <CameraOff size={36} className="opacity-90" />
          <p className="text-sm font-medium">{errMsg}</p>
          <p className="text-xs text-white/50">Paste a ticket link or token below.</p>
        </div>
      )}
      <div id={regionId} className="w-full min-h-[280px] sm:min-h-[320px]" />
    </div>
  );
}
