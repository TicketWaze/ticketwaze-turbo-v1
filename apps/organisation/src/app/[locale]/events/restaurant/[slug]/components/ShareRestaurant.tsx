"use client";
import { ButtonNeutral, ButtonPrimary } from "@/components/shared/buttons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import TruncateUrl from "@/lib/TruncateUrl";
import { cn } from "@/lib/utils";
import { renderMenuQrCard } from "@/lib/menuQrCard";
import { Restaurant } from "@ticketwaze/typescript-config";
import { Copy, Send2 } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";

/**
 * Sharing a restaurant is not the same act as sharing an event. An event link is
 * passed around online; a restaurant's QR is printed and put on the table, so
 * the code itself is the primary artifact and the link is secondary.
 *
 * The URL is built from the slug, never the id — that slug is what ends up
 * printed, and it is treated as immutable for exactly this reason.
 *
 * Downloading produces a designed table card rather than a bare code; the
 * drawing lives in `lib/menuQrCard.ts`. A code on its own gives a guest nothing
 * to act on and the venue nothing to put on a table.
 */
export default function ShareRestaurant({
  restaurant,
  className,
  organisationName,
  organisationLogoUrl,
}: {
  restaurant: Restaurant;
  /** Lets the caller size the trigger — mobile stretches it to fill its row. */
  className?: string;
  organisationName?: string;
  organisationLogoUrl?: string | null;
}) {
  const t = useTranslations("Events.restaurantDetail");
  const [busy, setBusy] = useState(false);

  // Deliberately locale-free. The website serves its default locale unprefixed,
  // and a printed code outlives whichever language the staff member happened to
  // be using when they generated it — the page lets the guest switch.
  const menuLink = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/r/${restaurant.slug}`;

  async function handleDownloadQR() {
    setBusy(true);
    try {
      const url = await renderMenuQrCard({
        menuLink,
        venueName: restaurant.name,
        cta: t("qr_card_cta"),
        hint: t("qr_card_hint"),
        organisationName,
        organisationLogoUrl,
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${restaurant.slug}-menu-qrcode.png`;
      a.click();
    } catch {
      toast.error(t("qr_download_failed"));
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(menuLink);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copy"));
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <ButtonNeutral className={cn("gap-4", className)}>
          <Send2 variant={"Bulk"} color={"#737C8A"} size={20} />
          {t("share")}
        </ButtonNeutral>
      </DialogTrigger>
      {/* Narrower than the form dialogs — this holds one code and one link —
          and capped in height so a short viewport scrolls instead of pushing
          the link field off screen. */}
      <DialogContent className="w-xl lg:w-[40rem] max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-medium border-b border-neutral-100 pb-6 text-[2.6rem] leading-12 text-black font-primary">
            {t("share")}
          </DialogTitle>
          {/* The QR is self-explanatory; the paragraph that used to sit here
              only pushed the code down. */}
          <DialogDescription className="sr-only">
            {t("share_text")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 pt-2">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white rounded-2xl border border-neutral-200">
              <QRCodeCanvas
                value={menuLink}
                size={190}
                // Matches the printed card: the preview must not scan
                // differently from the artwork it represents.
                level="H"
                marginSize={2}
                imageSettings={{
                  src: "/logo-simple-orange.svg",
                  height: 38,
                  width: 38,
                  excavate: true,
                }}
              />
            </div>
            <ButtonPrimary
              className="w-full gap-4"
              disabled={busy}
              onClick={handleDownloadQR}
            >
              {busy ? <LoadingCircleSmall /> : t("download_qr")}
            </ButtonPrimary>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[1.4rem] font-medium text-neutral-700">
              {t("menu_link")}
            </span>
            <div className="flex items-center justify-between gap-4 bg-neutral-100 rounded-[1.5rem] px-6 py-4">
              <span className="text-[1.4rem] leading-8 text-deep-100 truncate">
                {TruncateUrl(menuLink, 40)}
              </span>
              <button
                type="button"
                onClick={copyLink}
                aria-label={t("copy")}
                className="cursor-pointer shrink-0"
              >
                <Copy variant="Bulk" color="#737C8A" size={20} />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
