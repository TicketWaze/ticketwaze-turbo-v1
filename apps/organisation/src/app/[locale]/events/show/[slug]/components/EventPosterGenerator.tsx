"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { slugify } from "@/lib/Slugify";
import { Event } from "@ticketwaze/typescript-config";
import { DateTime } from "luxon";
import { Download, ImagePlay, Share2 } from "lucide-react";
import { useLocale } from "next-intl";
import QRCode from "qrcode";
import { useRef, useState } from "react";

// ─── Canvas spec ──────────────────────────────────────────────────────────────
const W = 1080; // Instagram portrait width
const H = 1350; // 4:5 ratio
const M = 60; // horizontal margin

// ─── Layout Y anchors (fixed grid — design-token style) ───────────────────────
const Y = {
  headerTop: 0,
  headerH: 82,
  imageTop: 82,
  imageH: 460,
  imageBottom: 542,
  barH: 5,
  barBottom: 547,
  titleStart: 570,
  titleLineH: 86,
  detailsTop: 760,
  detailsH: 90,
  // side-by-side section: detailsTop(760) + labelH(36) + gap(14) + qrBox(400) = 1210
  payLabel: 1228,
  payBadges: 1266,
  badgeH: 52,
  footerLine: 1308,
  footerH: 42,
};

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#0b0b0b",
  header: "#0e0e0e",
  surface: "#161616",
  surface2: "#1c1c1c",
  border: "#222222",
  border2: "#2c2c2c",
  orange: "#E45B00",
  orangeA: "rgba(228,91,0,0.22)",
  white: "#FFFFFF",
  offwhite: "#EEEEEE",
  muted: "#777777",
  dim: "#3f3f3f",
  dimmer: "#252525",
};

// ─── Typography helper ────────────────────────────────────────────────────────
const font = (weight: string, size: number, serif = false) =>
  `${weight} ${size}px ${
    serif
      ? 'Georgia,"Times New Roman",serif'
      : '"Bricolage Grotesque","Arial Black",Arial,sans-serif'
  }`;

// ─── Utilities ────────────────────────────────────────────────────────────────

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
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Route external URLs through the same-origin proxy so the canvas is never
// tainted and toDataURL() always works for the download.
function proxied(src: string): string {
  if (src.startsWith("/") || src.startsWith("data:")) return src;
  return `/api/proxy-image?url=${encodeURIComponent(src)}`;
}

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = () => resolve(null);
    el.src = src;
  });
}

/** Wraps text left-aligned at x; returns Y after last line. */
function drawWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxW: number,
  lineH: number,
  maxLines: number,
): number {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      if (lines.length === maxLines) {
        cur = "";
        break;
      }
      cur = w;
    } else cur = test;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  ctx.textBaseline = "top";
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineH));
  return startY + lines.length * lineH;
}

// ─── Section painters ─────────────────────────────────────────────────────────

// 1. HEADER ── branded top bar with the wide Ticketwaze logo
async function paintHeader(ctx: CanvasRenderingContext2D) {
  // background
  ctx.fillStyle = C.header;
  ctx.fillRect(0, Y.headerTop, W, Y.headerH);

  // bottom separator (1px with fade)
  const sep = ctx.createLinearGradient(0, 0, W, 0);
  sep.addColorStop(0, "rgba(228,91,0,0)");
  sep.addColorStop(0.5, "rgba(228,91,0,0.35)");
  sep.addColorStop(1, "rgba(228,91,0,0)");
  ctx.fillStyle = sep;
  ctx.fillRect(0, Y.headerH - 1, W, 1);

  // wide Ticketwaze logo (SVG — all paths render fine in canvas)
  const logoW = 320,
    logoH = 60;
  const lx = (W - logoW) / 2;
  const ly = (Y.headerH - logoH) / 2;

  const logo = await loadImg("/logo-horizontal-orange.svg");
  if (logo) {
    ctx.drawImage(logo, lx, ly, logoW, logoH);
  } else {
    // fallback: icon + wordmark
    const icon = await loadImg("/logo-simple-orange.svg");
    if (icon) ctx.drawImage(icon, lx, ly, logoH, logoH);
    ctx.fillStyle = C.white;
    ctx.font = font("bold", 32);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Ticketwaze", lx + logoH + 12, Y.headerH / 2);
  }

  // "ticketwaze.com" — right side
  // ctx.font = font("400", 22);
  // ctx.fillStyle = C.muted;
  // ctx.textAlign = "right";
  // ctx.textBaseline = "middle";
  // ctx.fillText("ticketwaze.com", W - M, Y.headerH / 2);
}

// 2. HERO IMAGE ── full-bleed cover photo with cinematic gradients
async function paintHero(ctx: CanvasRenderingContext2D, imageUrl: string) {
  const { imageTop: iy, imageH: ih } = Y;

  const img = await loadImg(proxied(imageUrl));
  if (img) {
    // cover-crop
    const srcR = img.naturalWidth / img.naturalHeight;
    const dstR = W / ih;
    let sx = 0,
      sy = 0,
      sw = img.naturalWidth,
      sh = img.naturalHeight;
    if (srcR > dstR) {
      sw = sh * dstR;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      sh = sw / dstR;
      sy = (img.naturalHeight - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, iy, W, ih);
  } else {
    // gradient placeholder
    const g = ctx.createLinearGradient(0, iy, W, iy + ih);
    g.addColorStop(0, "#1f0a00");
    g.addColorStop(1, "#0b0b0b");
    ctx.fillStyle = g;
    ctx.fillRect(0, iy, W, ih);
  }

  // cinematic bottom fade — two-stop blend for depth
  const fadeH = 260;
  const fade = ctx.createLinearGradient(0, iy + ih - fadeH, 0, iy + ih);
  fade.addColorStop(0, "rgba(11,11,11,0)");
  fade.addColorStop(0.55, "rgba(11,11,11,0.65)");
  fade.addColorStop(1, "rgba(11,11,11,1)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, iy + ih - fadeH, W, fadeH);

  // side vignettes — subtle edge darkening
  const vigW = 100;
  const vigL = ctx.createLinearGradient(0, 0, vigW, 0);
  vigL.addColorStop(0, "rgba(0,0,0,0.45)");
  vigL.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = vigL;
  ctx.fillRect(0, iy, vigW, ih);

  const vigR = ctx.createLinearGradient(W - vigW, 0, W, 0);
  vigR.addColorStop(0, "rgba(0,0,0,0)");
  vigR.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = vigR;
  ctx.fillRect(W - vigW, iy, vigW, ih);
}

// 3. ORANGE ACCENT BAR
function paintAccentBar(ctx: CanvasRenderingContext2D) {
  // gradient bar for more elegance
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, C.orange);
  g.addColorStop(0.45, "#FF6D1A");
  g.addColorStop(1, C.orange);
  ctx.fillStyle = g;
  ctx.fillRect(0, Y.imageBottom, W, Y.barH);
}

// 4. EVENT TITLE ── large, left-aligned
function paintTitle(ctx: CanvasRenderingContext2D, name: string): number {
  ctx.fillStyle = C.white;
  ctx.font = font("bold", 84);
  ctx.textAlign = "left";
  return drawWrapped(
    ctx,
    name.toUpperCase(),
    M,
    Y.titleStart,
    W - M * 2,
    Y.titleLineH,
    2,
  );
}

// 5 + 6 + 7. DETAILS (left) + QR CODE (right) — side by side
async function paintDetailAndQR(
  ctx: CanvasRenderingContext2D,
  date: string,
  venue: string,
  price: string,
  url: string,
): Promise<number> {
  // ── Grid ────────────────────────────────────────────────────────────────────
  const SEC_Y = Y.detailsTop; // 760
  const LEFT_X = M; // 60
  const LEFT_W = 288;
  const GAP = 44;
  const RIGHT_X = LEFT_X + LEFT_W + GAP; // 392
  const RIGHT_W = W - M - RIGHT_X; // 628

  // QR dimensions — fill as much of the right column as possible
  const QR_BOX = Math.min(RIGHT_W, 400); // max 400px square card
  const QR_PAD = 22;
  const QR_SIZE = QR_BOX - QR_PAD * 2; // 356px of actual QR pixels
  const QR_X = RIGHT_X + (RIGHT_W - QR_BOX) / 2;

  // "Scan" label sits above the card
  const LABEL_H = 36;
  const LABEL_GAP = 14;
  const QR_Y = SEC_Y + LABEL_H + LABEL_GAP; // card top
  const SEC_BOTTOM = QR_Y + QR_BOX; // section bottom

  // Left column: 3 rows that span the same height as the QR card
  const ITEM_H = QR_BOX / 3;
  const items = [
    { emoji: "📅", label: "DATE", value: date || "—" },
    { emoji: "📍", label: "VENUE", value: venue || "—" },
    { emoji: "💰", label: "PRICE", value: price || "—" },
  ];

  // ── Left column ─────────────────────────────────────────────────────────────
  items.forEach(({ emoji, label, value }, i) => {
    const iy = QR_Y + i * ITEM_H;

    // row separator (not on first)
    if (i > 0) {
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(LEFT_X, iy);
      ctx.lineTo(LEFT_X + LEFT_W, iy);
      ctx.stroke();
    }

    // orange left accent bar
    ctx.fillStyle = C.orange;
    ctx.fillRect(LEFT_X, iy + (i === 0 ? 0 : 1), 3, ITEM_H - (i === 0 ? 0 : 1));

    const textX = LEFT_X + 20;
    const textY = iy + ITEM_H / 2;

    // emoji
    ctx.font = "34px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, textX, textY - 14);

    // label
    ctx.font = font("700", 20);
    ctx.fillStyle = C.orange;
    ctx.fillText(label, textX + 44, textY - 18);

    // value — wrap to two lines within column width
    ctx.font = font("500", 26);
    ctx.fillStyle = C.offwhite;
    ctx.textBaseline = "top";
    drawWrapped(ctx, value, textX + 44, textY - 2, LEFT_W - 64, 32, 2);
  });

  // bottom border under last item
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(LEFT_X, SEC_BOTTOM);
  ctx.lineTo(LEFT_X + LEFT_W, SEC_BOTTOM);
  ctx.stroke();

  // ── Right column — "SCAN TO GET TICKETS" label ──────────────────────────────
  ctx.font = font("600", 24);
  ctx.fillStyle = C.muted;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("SCAN TO GET TICKETS", RIGHT_X + RIGHT_W / 2, SEC_Y);

  // ── QR card with orange glow ─────────────────────────────────────────────────
  ctx.save();
  ctx.shadowColor = C.orangeA;
  ctx.shadowBlur = 60;
  ctx.fillStyle = C.white;
  rrect(ctx, QR_X, QR_Y, QR_BOX, QR_BOX, 20);
  ctx.fill();
  ctx.restore();

  // QR code image
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: QR_SIZE * 2,
      margin: 1,
      errorCorrectionLevel: "H",
      color: { dark: "#0b0b0b", light: "#ffffff" },
    });
    const qrImg = await loadImg(dataUrl);
    if (qrImg)
      ctx.drawImage(qrImg, QR_X + QR_PAD, QR_Y + QR_PAD, QR_SIZE, QR_SIZE);
  } catch {
    /* skip */
  }

  // Ticketwaze logo centred on QR
  const lx = QR_X + QR_BOX / 2;
  const ly = QR_Y + QR_PAD + QR_SIZE / 2;
  const lr = 34;
  ctx.fillStyle = C.white;
  ctx.beginPath();
  ctx.arc(lx, ly, lr + 5, 0, Math.PI * 2);
  ctx.fill();
  const li = await loadImg("/logo-simple-orange.svg");
  if (li) ctx.drawImage(li, lx - lr, ly - lr, lr * 2, lr * 2);

  return SEC_BOTTOM;
}

// 8. PAYMENT ICONS ── actual logos from public/
async function paintPayments(ctx: CanvasRenderingContext2D) {
  const bY = Y.payBadges;
  const bH = Y.badgeH; // 52
  const gap = 14;
  const r = 10;
  const pad = 10;

  // forceAr overrides naturalWidth/naturalHeight — MonCash SVG declares width="20"
  // height="21" but its visible content rect is 20×12.676, true ratio ≈ 1.578:1
  const methods: Array<{ src: string; w: number; forceAr?: number }> = [
    { src: "/moncash.svg", w: 148, forceAr: 20 / 12.676 },
    { src: "/visa.png", w: 100 },
    { src: "/mastercard.png", w: 100 },
    { src: "/apple-pay.webp", w: 124 },
    { src: "/google-pay.png", w: 134 },
  ];

  const imgs = await Promise.all(methods.map((m) => loadImg(m.src)));

  const totalW =
    methods.reduce((sum, m) => sum + m.w, 0) + gap * (methods.length - 1);
  let bx = (W - totalW) / 2;

  methods.forEach((m, i) => {
    // white card — all payment logos are designed for white backgrounds;
    // avoids invisible logos when the logo color matches the badge color
    ctx.fillStyle = C.white;
    rrect(ctx, bx, bY, m.w, bH, r);
    ctx.fill();

    // subtle border so the card reads against the dark poster
    ctx.strokeStyle = "#DDDDDD";
    ctx.lineWidth = 1.5;
    rrect(ctx, bx, bY, m.w, bH, r);
    ctx.stroke();

    // logo — centered, aspect-ratio-preserving fit
    const img = imgs[i];
    if (img) {
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      const ar = m.forceAr ?? (nw > 0 && nh > 0 ? nw / nh : 2);
      const maxW = m.w - pad * 2;
      const maxH = bH - pad * 2;
      let dw = maxW,
        dh = dw / ar;
      if (dh > maxH) {
        dh = maxH;
        dw = dh * ar;
      }
      const dx = bx + (m.w - dw) / 2;
      const dy = bY + (bH - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    bx += m.w + gap;
  });
}

// 9. FOOTER ── brand lockup on dark base
// async function paintFooter(ctx: CanvasRenderingContext2D) {
//   // separator
//   ctx.strokeStyle = C.border;
//   ctx.lineWidth = 1;
//   ctx.setLineDash([]);
//   ctx.beginPath();
//   ctx.moveTo(0, Y.footerLine);
//   ctx.lineTo(W, Y.footerLine);
//   ctx.stroke();

//   // background gradient
//   const fg = ctx.createLinearGradient(0, Y.footerLine, 0, H);
//   fg.addColorStop(0, "#111111");
//   fg.addColorStop(1, "#080808");
//   ctx.fillStyle = fg;
//   ctx.fillRect(0, Y.footerLine, W, H - Y.footerLine);

//   const cy = Y.footerLine + (H - Y.footerLine) / 2;

//   // Icon mark — small orange circle + "T"
//   const ir = 18,
//     ix = W / 2 - 172;
//   ctx.fillStyle = C.orange;
//   ctx.beginPath();
//   ctx.arc(ix, cy, ir, 0, Math.PI * 2);
//   ctx.fill();
//   ctx.fillStyle = C.white;
//   ctx.font = font("bold", 17);
//   ctx.textAlign = "center";
//   ctx.textBaseline = "middle";
//   ctx.fillText("T", ix, cy);

//   // "Powered by Ticketwaze"
//   ctx.textAlign = "left";
//   ctx.fillStyle = C.muted;
//   ctx.font = font("400", 24);
//   ctx.fillText("Powered by", ix + ir + 14, cy);
//   ctx.fillStyle = C.orange;
//   ctx.font = font("700", 24);
//   const pwText = ctx.measureText("Powered by ").width;
//   ctx.fillText("Ticketwaze", ix + ir + 14 + pwText, cy);

//   // dot separator
//   ctx.fillStyle = C.dim;
//   ctx.beginPath();
//   ctx.arc(ix + ir + 14 + pwText + 140, cy, 3, 0, Math.PI * 2);
//   ctx.fill();

//   // URL
//   ctx.fillStyle = C.dim;
//   ctx.font = font("400", 22);
//   ctx.fillText("ticketwaze.com", ix + ir + 14 + pwText + 152, cy);
// }

// ─── Orchestrator ─────────────────────────────────────────────────────────────

async function buildPoster(
  canvas: HTMLCanvasElement,
  event: Event,
  eventLink: string,
  locale: string,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = W;
  canvas.height = H;

  // Global background
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // Sections — some are async (image / QR loads)
  await paintHeader(ctx);
  await paintHero(ctx, event.eventImageUrl);
  paintAccentBar(ctx);
  paintTitle(ctx, event.eventName);

  // Compute display values
  const firstDay =
    event.eventDays.find((d) => d.dayNumber === 1) ?? event.eventDays[0];
  const date = firstDay
    ? DateTime.fromISO(firstDay.eventDate)
        .setLocale(locale)
        .toFormat("MMM d, yyyy")
    : "";
  const minPrice = event.eventTicketTypes.length
    ? Math.min(...event.eventTicketTypes.map((t) => t.ticketTypePrice))
    : 0;
  const minUsdPrice = event.eventTicketTypes.length
    ? Math.min(...event.eventTicketTypes.map((t) => t.usdPrice))
    : 0;
  const price =
    minPrice === 0
      ? "Free"
      : `From ${event.currency === "HTG" ? minPrice : minUsdPrice} ${event.currency}`;
  const venue = [event.address, event.city].filter(Boolean).join(", ");

  await paintDetailAndQR(ctx, date, venue, price, eventLink);
  await paintPayments(ctx);
  // await paintFooter(ctx);
}

// ─── React component ──────────────────────────────────────────────────────────

export default function EventPosterGenerator({ event }: { event: Event }) {
  const locale = useLocale();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"idle" | "busy" | "done">("idle");

  const eventLink = `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/explore/${slugify(event.eventName, event.eventId)}`;

  async function generate() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setPhase("busy");
    try {
      await buildPoster(canvas, event, eventLink, locale);
      setPhase("done");
    } catch {
      setPhase("idle");
    }
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${slugify(event.eventName, event.eventId)}-poster.png`;
    a.click();
  }

  async function share() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/png"),
    );
    if (!blob) return;
    const file = new File(
      [blob],
      `${slugify(event.eventName, event.eventId)}-poster.png`,
      {
        type: "image/png",
      },
    );
    const shareData: ShareData = {
      title: event.eventName,
      text: `${event.eventName}\n${eventLink}`,
      files: [file],
    };
    if (navigator.canShare?.(shareData)) {
      await navigator.share(shareData);
    } else {
      // fallback: share without file (url + text only)
      await navigator.share({
        title: event.eventName,
        text: `${event.eventName}\n${eventLink}`,
      });
    }
  }

  function reset() {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, W, H);
    }
    setPhase("idle");
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) reset();
      }}
    >
      <DialogTrigger asChild>
        <button
          className="flex items-center justify-center w-18 h-18 bg-neutral-100 rounded-full cursor-pointer hover:bg-neutral-200 transition-colors"
          title="Generate Instagram poster"
        >
          <ImagePlay size={20} color="#737c8a" />
        </button>
      </DialogTrigger>

      <DialogContent className="w-[95vw] max-w-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-medium text-[2.2rem] leading-12 text-black font-primary border-b border-neutral-100 pb-8">
            Instagram Poster
          </DialogTitle>
          <DialogDescription className="sr-only">
            Generate a downloadable 1080×1350 poster for Instagram
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-10 pt-2">
          {/* Preview area */}
          <div className="w-full">
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              className="w-full rounded-[10px] border border-neutral-100"
              style={{ display: phase === "done" ? "block" : "none" }}
            />

            {phase !== "done" && (
              <div
                className="w-full bg-neutral-50 rounded-[10px] border border-neutral-100 flex flex-col items-center justify-center gap-6 cursor-pointer select-none"
                style={{ aspectRatio: "4/5" }}
                onClick={phase === "idle" ? generate : undefined}
              >
                {phase === "idle" && (
                  <>
                    <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center">
                      <ImagePlay size={32} color="#9ca3af" />
                    </div>
                    <p className="text-[1.4rem] text-neutral-400 font-medium">
                      Click to generate
                    </p>
                  </>
                )}
                {phase === "busy" && (
                  <>
                    <div className="w-10 h-10 border-[3px] border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[1.4rem] text-neutral-400">
                      Generating…
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6 pb-2">
            {phase === "idle" && (
              <button
                onClick={generate}
                className="flex items-center gap-4 px-12 py-5 rounded-[100px] bg-primary-500 text-white text-[1.5rem] font-medium cursor-pointer hover:bg-primary-500/90 transition-colors"
              >
                <ImagePlay size={18} />
                Generate Poster
              </button>
            )}

            {phase === "done" && (
              <>
                {/* <button
                  onClick={reset}
                  className="flex items-center gap-4 px-10 py-5 rounded-[100px] border border-neutral-200 text-[1.5rem] font-medium text-neutral-600 cursor-pointer hover:border-neutral-300 transition-colors"
                >
                  <RefreshCw size={16} />
                  Regenerate
                </button> */}
                <button
                  onClick={download}
                  className="flex items-center gap-4 px-12 py-5 rounded-[100px] bg-primary-500 text-white text-[1.5rem] font-medium cursor-pointer hover:bg-primary-500/90 transition-colors"
                >
                  <Download size={18} />
                  Download PNG
                </button>
                {"share" in navigator && (
                  <button
                    onClick={share}
                    className="flex items-center gap-4 px-10 py-5 rounded-[100px] border border-neutral-200 text-[1.5rem] font-medium text-neutral-600 cursor-pointer hover:border-neutral-300 transition-colors"
                  >
                    <Share2 size={16} />
                    Share
                  </button>
                )}
              </>
            )}
          </div>

          <p className="text-[1.15rem] text-neutral-400 text-center -mt-4 pb-2">
            1080 × 1350 px · Instagram portrait format
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
