"use client";

import { useEffect } from "react";

function getReasonMessage(reason: unknown): string {
  if (reason instanceof Error) {
    return reason.message;
  }

  if (typeof reason === "string") {
    return reason;
  }

  if (reason && typeof reason === "object" && "message" in reason) {
    const value = (reason as { message?: unknown }).message;
    if (typeof value === "string") {
      return value;
    }
  }

  return "";
}

function isKnownMediaAbort(reason: unknown): boolean {
  const message = getReasonMessage(reason).toLowerCase();
  if (!message) {
    return false;
  }

  if (!message.includes("play() request was interrupted")) {
    return false;
  }

  return message.includes("media was removed from the document");
}

export default function UnhandledMediaAbortGuard() {
  useEffect(() => {
    const originalPlay = HTMLMediaElement.prototype.play;

    HTMLMediaElement.prototype.play = function patchedPlay(...args: Parameters<typeof originalPlay>) {
      const playResult = originalPlay.apply(this, args);

      if (playResult && typeof (playResult as Promise<void>).catch === "function") {
        return (playResult as Promise<void>).catch((error: unknown) => {
          if (isKnownMediaAbort(error)) {
            return;
          }

          throw error;
        });
      }

      return playResult;
    };

    const suppressEvent = (event: Event) => {
      event.preventDefault();
      if (typeof (event as Event & { stopImmediatePropagation?: () => void }).stopImmediatePropagation === "function") {
        (event as Event & { stopImmediatePropagation: () => void }).stopImmediatePropagation();
      }
      event.stopPropagation();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isKnownMediaAbort(event.reason)) {
        suppressEvent(event);
      }
    };

    const handleWindowError = (event: ErrorEvent) => {
      if (isKnownMediaAbort(event.error ?? event.message)) {
        suppressEvent(event);
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleWindowError);
    return () => {
      HTMLMediaElement.prototype.play = originalPlay;
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleWindowError);
    };
  }, []);

  return null;
}
