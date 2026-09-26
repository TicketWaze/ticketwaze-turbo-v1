"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { CameraSlash } from "iconsax-reactjs";
import {
  TICKET_CAMERA_CONFIG,
  TICKET_DECODER_CONFIG,
} from "@/lib/ticketScanner";

function hasCameraApi() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

type CameraError = "denied" | "unavailable" | "insecure" | "failed";

export type TicketCameraMessages = Record<CameraError, string> & {
  retry: string;
};

/**
 * THE DOOR CAMERA: OPENS THE BACK CAMERA AND REPORTS THE FIRST CODE IT READS.
 *
 * Drives `Html5Qrcode` directly rather than the `Html5QrcodeScanner` widget.
 * The widget put its own "Request camera permissions" button, then a camera
 * picker, then a "Start" button in front of every scan. Here one tap on the
 * dialog's Start opens the camera: the browser asks once, remembers the answer
 * for the site, and every later scan goes straight to the viewfinder.
 *
 * `onScan` fires once per mount. The dialog remounts this (via `key`) to scan
 * the next ticket.
 */
export default function TicketCamera({
  onScan,
  messages,
}: {
  onScan: (raw: string) => void;
  messages: TicketCameraMessages;
}) {
  // useId yields ":r0:"-style ids; html5-qrcode looks the element up by id.
  const elementId = `ticket-camera-${useId().replace(/:/g, "")}`;
  // getUserMedia only exists on https (and localhost). A phone pointed at a
  // dev machine's LAN address has no camera API at all.
  const [error, setError] = useState<CameraError | null>(() =>
    hasCameraApi() ? null : "insecure",
  );
  const [attempt, setAttempt] = useState(0);
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!hasCameraApi()) return;

    let done = false;
    const camera = new Html5Qrcode(elementId, TICKET_DECODER_CONFIG);
    const starting = camera
      .start(
        TICKET_CAMERA_CONFIG.videoConstraints,
        TICKET_CAMERA_CONFIG,
        (text) => {
          if (done) return;
          done = true;
          onScanRef.current(text);
        },
        () => {},
      )
      .catch((reason: unknown) => {
        // The library rejects with a string that embeds the DOMException name.
        const message = String(reason);
        if (/NotAllowedError|Permission|SecurityError/i.test(message)) {
          setError("denied");
        } else if (/NotFoundError|OverconstrainedError|NotReadableError/i.test(message)) {
          setError("unavailable");
        } else {
          setError("failed");
        }
      });

    return () => {
      done = true;
      // Stop only once start has settled; stopping mid-start leaves the
      // camera light on until the page is closed.
      starting.finally(async () => {
        try {
          const state = camera.getState();
          if (
            state === Html5QrcodeScannerState.SCANNING ||
            state === Html5QrcodeScannerState.PAUSED
          ) {
            await camera.stop();
          }
          camera.clear();
        } catch {
          // Already stopped.
        }
      });
    };
  }, [elementId, attempt]);

  if (error) {
    return (
      <div className="w-full h-[280px] border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center gap-4 px-6 text-center">
        <CameraSlash variant="Bulk" color="#737C8A" size={48} />
        <p className="text-neutral-600 text-[1.4rem] leading-7">
          {messages[error]}
        </p>
        {error !== "insecure" && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setAttempt((n) => n + 1);
            }}
            className="text-primary-500 font-medium text-[1.4rem] cursor-pointer"
          >
            {messages.retry}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      key={attempt}
      id={elementId}
      className="w-full min-h-[280px] overflow-hidden rounded-lg bg-black [&_video]:!rounded-lg [&_video]:!object-cover"
    />
  );
}
