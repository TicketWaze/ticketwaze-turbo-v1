import { Html5QrcodeSupportedFormats } from "html5-qrcode";

/**
 * THE TICKET ID IN WHATEVER THE CAMERA OR THE KEYBOARD PRODUCED, OR NULL.
 *
 * Every ticket's QR (purchase, reward, giveaway; emailed image or in-app)
 * encodes its UUID: uppercase on new tickets, lowercase on older ones. The
 * value also goes into the request PATH, so anything else a camera might read
 * (a URL, stray whitespace, another app's QR) is rejected here rather than
 * sent to a route it would not match. Mirrors `parseTicketCode` in the API.
 */
const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function extractTicketCode(raw: string | null | undefined): string | null {
  const match = String(raw ?? "").match(UUID_PATTERN);
  return match ? match[0].toLowerCase() : null;
}

/**
 * Camera settings for the door scanner.
 *
 * - QR only: the library otherwise tries every barcode format on every frame,
 *   which is slower and the only way it can misread something as a ticket.
 * - The browser's native BarcodeDetector when it has one (Chrome/Android,
 *   recent Safari): much faster and more tolerant of glare and angle than the
 *   JavaScript decoder, which remains the fallback.
 * - 10 frames a second instead of 5, so a code held up briefly is caught.
 * - A scan box sized to the camera view (70% of its shorter side) rather than
 *   a fixed 250px, which was too small on a tablet and cramped on a phone.
 */
export const TICKET_SCANNER_CONFIG = {
  fps: 10,
  qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
    const side = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.7);
    const clamped = Math.max(180, side);
    return { width: clamped, height: clamped };
  },
  aspectRatio: 1.0,
  formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
  experimentalFeatures: { useBarCodeDetectorIfSupported: true },
  rememberLastUsedCamera: true,
  videoConstraints: { facingMode: { ideal: "environment" } },
};
