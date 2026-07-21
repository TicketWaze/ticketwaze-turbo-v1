import QRCode from "qrcode";

/**
 * Draws the printable "scan for our menu" card a venue puts on its tables.
 *
 * Lives outside the component on purpose. It is a couple of hundred lines of
 * canvas work with no React in it, and keeping it here means the dialog stays
 * readable and this stays testable on its own.
 *
 * Portrait, sized for a table tent, using the same palette and type as the
 * event poster generator so a venue's printed material and its event posters
 * look like one product.
 */

const W = 1080;
const H = 1500;

const C = {
  bg: "#0b0b0b",
  border: "#222222",
  orange: "#E45B00",
  white: "#FFFFFF",
  muted: "#777777",
};

const font = (weight: string, size: number) =>
  `${weight} ${size}px "Bricolage Grotesque","Arial Black",Arial,sans-serif`;

/**
 * Same-origin proxy, so drawing a remote logo never taints the canvas and
 * `toDataURL()` keeps working. Public assets are already same-origin.
 */
function proxied(src: string): string {
  if (src.startsWith("/") || src.startsWith("data:")) return src;
  return `/api/proxy-image?url=${encodeURIComponent(src)}`;
}

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    // Resolving null rather than rejecting: a missing logo must not cost the
    // venue its QR code.
    el.onerror = () => resolve(null);
    el.src = src;
  });
}

function rrect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Shrinks the font until the text fits, rather than wrapping a venue name. */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  weight: string,
  startSize: number,
  minSize: number,
): number {
  let size = startSize;
  ctx.font = font(weight, size);
  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 2;
    ctx.font = font(weight, size);
  }
  return size;
}

export type MenuQrCardInput = {
  menuLink: string;
  venueName: string;
  /** "Scan for our menu" — already localised by the caller. */
  cta: string;
  /** The small line under the code. */
  hint: string;
  organisationName?: string;
  organisationLogoUrl?: string | null;
};

/** Returns a PNG data URL, ready to hand to a download anchor. */
export async function renderMenuQrCard(
  input: MenuQrCardInput,
): Promise<string> {
  // Canvas text falls back to a system font if the brand face has not finished
  // loading, which would silently ship the wrong type.
  await document.fonts.ready.catch(() => undefined);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // ── Venue name ─────────────────────────────────────────────────────────────
  const nameSize = fitText(ctx, input.venueName, W - 160, "700", 72, 40);
  ctx.fillStyle = C.white;
  ctx.font = font("700", nameSize);
  ctx.fillText(input.venueName, W / 2, 120);

  // ── Call to action ─────────────────────────────────────────────────────────
  ctx.fillStyle = C.orange;
  ctx.font = font("600", 34);
  ctx.fillText(input.cta.toUpperCase(), W / 2, 120 + nameSize + 34);

  // ── QR panel ───────────────────────────────────────────────────────────────
  // Level H (30% recovery) because a logo is punched into the middle; at the
  // default level that hole makes the code unreadable.
  const qrDataUrl = await QRCode.toDataURL(input.menuLink, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 1000,
    color: { dark: "#0b0b0b", light: "#ffffff" },
  });
  const qrImg = await loadImg(qrDataUrl);

  const panel = 760;
  const panelX = (W - panel) / 2;
  const panelY = 340;
  ctx.fillStyle = C.white;
  rrect(ctx, panelX, panelY, panel, panel, 40);
  ctx.fill();

  if (qrImg) {
    const inset = 40;
    ctx.drawImage(
      qrImg,
      panelX + inset,
      panelY + inset,
      panel - inset * 2,
      panel - inset * 2,
    );
  }

  // ── TicketWaze mark, centred in the code ───────────────────────────────────
  const mark = await loadImg("/logo-simple-orange.svg");
  // The mark is an SVG with a viewBox but no intrinsic width/height, which some
  // browsers report as 0x0. Checking before drawing means a browser that cannot
  // rasterise it leaves the code intact rather than punching a white hole in it
  // and drawing nothing inside.
  if (mark && mark.naturalWidth > 0) {
    const markBox = 132;
    const cx = W / 2;
    const cy = panelY + panel / 2;
    // White knockout first: the mark must sit on a clear field or the scanner
    // reads it as data.
    ctx.fillStyle = C.white;
    rrect(ctx, cx - markBox / 2, cy - markBox / 2, markBox, markBox, markBox / 4);
    ctx.fill();
    const inner = markBox - 36;
    ctx.drawImage(mark, cx - inner / 2, cy - inner / 2, inner, inner);
  }

  // ── Fallback hint, for a phone whose camera will not scan ──────────────────
  ctx.fillStyle = C.muted;
  ctx.font = font("400", 26);
  ctx.fillText(input.hint, W / 2, panelY + panel + 46);

  // ── Organisation logo + name ───────────────────────────────────────────────
  let footerTop = panelY + panel + 130;
  if (input.organisationLogoUrl) {
    const logo = await loadImg(proxied(input.organisationLogoUrl));
    if (logo && logo.naturalWidth > 0) {
      const size = 108;
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, footerTop + size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(logo, W / 2 - size / 2, footerTop, size, size);
      ctx.restore();
      // Thin ring, so a dark logo still reads against the dark card.
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(W / 2, footerTop + size / 2, size / 2, 0, Math.PI * 2);
      ctx.stroke();
      footerTop += size + 24;
    }
  }

  if (input.organisationName) {
    ctx.fillStyle = C.white;
    ctx.font = font("600", 30);
    ctx.fillText(input.organisationName, W / 2, footerTop);
  }

  // ── Powered by, at the very bottom ─────────────────────────────────────────
  ctx.fillStyle = C.muted;
  ctx.font = font("400", 22);
  ctx.fillText("Powered by TicketWaze", W / 2, H - 70);

  return canvas.toDataURL("image/png");
}
