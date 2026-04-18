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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' ? message : '';
  }

  return '';
}

function isPlayInterruptedByRemoval(error: unknown): boolean {
  const message = getErrorMessage(error);
  return (
    message.includes('play() request was interrupted')
    && message.includes('media was removed from the document')
  );
}

function isScannerDebugEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('scannerDebug') === '1') {
      return true;
    }

    return window.localStorage.getItem('g-events:checkin-scanner-debug') === '1';
  } catch {
    return false;
  }
}

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
  const startedRef = useRef(false);
  /** Serialize stop/start so React Strict Mode (or fast remounts) never run two cameras at once. */
  const cameraChainRef = useRef(Promise.resolve());
  const debugEnabledRef = useRef(false);
  const activeRef = useRef(active);

  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const [phase, setPhase] = useState<'idle' | 'starting' | 'running' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const phaseRef = useRef<'idle' | 'starting' | 'running' | 'error'>('idle');

  const debugLog = useCallback(
    (step: string, details?: Record<string, unknown>) => {
      if (!debugEnabledRef.current) {
        return;
      }

      console.debug(`[CheckInQrScanner:${regionId}] ${step}`, {
        at: new Date().toISOString(),
        active: activeRef.current,
        phase: phaseRef.current,
        ...(details || {}),
      });
    },
    [regionId]
  );

  useEffect(() => {
    debugEnabledRef.current = isScannerDebugEnabled();
    if (debugEnabledRef.current) {
      console.debug(`[CheckInQrScanner:${regionId}] debug logging enabled`, {
        at: new Date().toISOString(),
      });
    }
  }, [regionId]);

  useEffect(() => {
    activeRef.current = active;
    debugLog('active:changed', { active });
  }, [active, debugLog]);

  useEffect(() => {
    phaseRef.current = phase;
    debugLog('phase:changed', { next: phase });
  }, [phase, debugLog]);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isPlayInterruptedByRemoval(event.reason)) {
        debugLog('unhandledrejection:suppressed', {
          message: getErrorMessage(event.reason),
        });
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [debugLog]);

  const stopScanner = useCallback(async () => {
    debugLog('stop:queued');
    const next = cameraChainRef.current.then(async () => {
      const s = scannerRef.current;
      scannerRef.current = null;
      const shouldClear = startedRef.current;
      startedRef.current = false;
      if (!s) {
        debugLog('stop:skip-no-scanner', { shouldClear });
        return;
      }

      debugLog('stop:begin', { shouldClear });
      try {
        await s.stop();
        debugLog('stop:stopped');
      } catch {
        debugLog('stop:already-stopped');
      }
      if (shouldClear) {
        try {
          s.clear();
          debugLog('stop:cleared');
        } catch {
          debugLog('stop:clear-failed');
        }
      }
    });
    cameraChainRef.current = next;
    await next;
    debugLog('stop:complete');
  }, [debugLog]);

  useEffect(() => {
    if (!active) {
      debugLog('effect:inactive-stop');
      void stopScanner();
      setPhase('idle');
      return;
    }

    let cancelled = false;

    const run = async () => {
      debugLog('start:requested');
      await stopScanner();
      if (cancelled) {
        debugLog('start:cancelled-before-start');
        return;
      }

      setPhase('starting');
      setErrMsg(null);

      try {
        debugLog('start:creating-scanner');
        const html5Qr = new Html5Qrcode(regionId, /* verbose */ false);
        scannerRef.current = html5Qr;
        startedRef.current = false;
        debugLog('start:calling-html5qrcode-start');
        await html5Qr.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 260, height: 260 },
          },
          (decodedText) => {
            debugLog('scan:decoded', { length: decodedText.length });
            onScanRef.current(decodedText);
          },
          () => {
            /* frame with no QR — ignore */
          }
        );
        startedRef.current = true;
        debugLog('start:running');
        if (cancelled) {
          debugLog('start:cancelled-after-start');
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
          startedRef.current = false;
          scannerRef.current = null;
          return;
        }
        setPhase('running');
      } catch (e) {
        if (isPlayInterruptedByRemoval(e)) {
          debugLog('start:play-interrupted-by-removal', {
            message: getErrorMessage(e),
          });
          scannerRef.current = null;
          startedRef.current = false;
          if (!cancelled) {
            setPhase('idle');
          }
          return;
        }

        const msg = getErrorMessage(e) || 'Camera unavailable';
        debugLog('start:error', { message: msg });
        scannerRef.current = null;
        startedRef.current = false;
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
      debugLog('effect:cleanup-stop');
      void stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- regionId is stable for component lifetime
  }, [active, stopScanner, onCameraError, debugLog]);

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
