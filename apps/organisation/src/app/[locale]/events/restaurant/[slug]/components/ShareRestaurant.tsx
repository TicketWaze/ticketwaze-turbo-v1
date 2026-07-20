"use client";
import { ButtonNeutral } from "@/components/shared/buttons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import TruncateUrl from "@/lib/TruncateUrl";
import { Restaurant } from "@ticketwaze/typescript-config";
import { Copy, Send2 } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";

/**
 * Sharing a restaurant is not the same act as sharing an event. An event link is
 * passed around online; a restaurant's QR is printed and put on the table, so
 * the code itself is the primary artifact and the link is secondary.
 *
 * The URL is built from the slug, never the id — that slug is what ends up
 * printed, and it is treated as immutable for exactly this reason.
 */
export default function ShareRestaurant({
  restaurant,
}: {
  restaurant: Restaurant;
}) {
  const t = useTranslations("Events.restaurantDetail");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Deliberately locale-free. The website serves its default locale unprefixed,
  // and a printed code outlives whichever language the staff member happened to
  // be using when they generated it — the page lets the guest switch.
  const menuLink = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/r/${restaurant.slug}`;

  function handleDownloadQR() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${restaurant.slug}-menu-qrcode.png`;
    a.click();
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
        <ButtonNeutral className="gap-4">
          <Send2 variant={"Bulk"} color={"#737C8A"} size={20} />
          {t("share")}
        </ButtonNeutral>
      </DialogTrigger>
      <DialogContent className={"w-xl lg:w-208"}>
        <DialogHeader>
          <DialogTitle
            className={
              "font-medium border-b border-neutral-100 pb-8 text-[2.6rem] leading-12 text-black font-primary"
            }
          >
            {t("share")}
          </DialogTitle>
          <DialogDescription className={"sr-only"}>
            Share restaurant menu
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-8 py-4">
          <p className="text-[1.5rem] leading-8 text-neutral-600">
            {t("share_text")}
          </p>

          <div className="flex flex-col items-center gap-6">
            <div className="p-6 bg-white rounded-2xl border border-neutral-200">
              <QRCodeCanvas
                ref={canvasRef}
                value={menuLink}
                size={200}
                level="M"
                marginSize={2}
              />
            </div>
            <span className="text-[1.2rem] leading-7 text-neutral-600">
              {t("qr_hint")}
            </span>
            <ButtonNeutral className="gap-4" onClick={handleDownloadQR}>
              {t("download_qr")}
            </ButtonNeutral>
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
