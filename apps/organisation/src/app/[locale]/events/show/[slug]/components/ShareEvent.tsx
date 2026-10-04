"use client";
import { Dialog } from "@/components/ui/dialog";
import ModalShell from "@/components/shared/ModalShell";
import { slugify } from "@/lib/Slugify";
import { Event } from "@ticketwaze/typescript-config";
import { Copy } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import Image, { StaticImageData } from "next/image";
import { useRef } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import Whatsapp from "@/assets/icons/whatsApp.svg";
import Twitter from "@/assets/icons/twitter.svg";
import Linkedin from "@/assets/icons/linkedIn.svg";
import Instagram from "@/assets/icons/instagram.svg";
import Tiktok from "@/assets/icons/tiktok.svg";
import { QRCodeCanvas } from "qrcode.react";
import { QrCode } from "lucide-react";
import EventPosterGenerator from "./EventPosterGenerator";

const roundButton =
  "flex items-center justify-center w-[4.5rem] h-[4.5rem] bg-neutral-100 rounded-full cursor-pointer transition-colors hover:bg-neutral-200";

/**
 * Figma's "Share Event" modal (1626:49207, mobile 2220:56118). Controlled, so
 * the header button, the empty table's "Promote" button and the phone layout
 * all open the same one.
 */
export default function ShareEvent({
  event,
  open,
  onOpenChange,
}: {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Events.single_event");
  const locale = useLocale();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const eventLink = `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/explore/${slugify(event.eventName, event.eventId)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(eventLink);
      return true;
    } catch {
      toast.error(t("share_dialog.copy_failed"));
      return false;
    }
  }

  function handleDownloadQR() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${slugify(event.eventName, event.eventId)}-qrcode.png`;
    a.click();
  }

  /* Instagram and TikTok have no web share link: the link goes on the
     clipboard and their site opens, so it can be pasted in a story or bio. */
  async function pasteInto(app: string, url: string) {
    if (await copyLink()) toast.success(t("share_dialog.paste_hint", { app }));
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const message = `Check this out — it’s worth your time!\nSomething exciting is happening and I wanted you to be part of it.\nReserve your spot now: ${eventLink}`;
  const socials: {
    label: string;
    icon: StaticImageData;
    href?: string;
    onClick?: () => void;
  }[] = [
    {
      label: "X",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
    },
    {
      label: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventLink)}`,
    },
    {
      label: "Instagram",
      icon: Instagram,
      onClick: () => pasteInto("Instagram", "https://www.instagram.com/"),
    },
    {
      label: "TikTok",
      icon: Tiktok,
      onClick: () => pasteInto("TikTok", "https://www.tiktok.com/upload"),
    },
    {
      label: "WhatsApp",
      icon: Whatsapp,
      href: `https://wa.me/?text=${encodeURIComponent(message)}`,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalShell title={t("share")} description={t("share_text")}>
        <div className="w-full flex items-center gap-4 border border-neutral-100 rounded-[10rem] p-[.6rem] pl-[1.5rem] shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <span className="flex-1 min-w-0 truncate font-sans text-[1.5rem] lg:text-[1.8rem] leading-10 text-neutral-700">
            {eventLink}
          </span>
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={async () => {
              if (await copyLink()) toast.success(t("share_dialog.copied"));
            }}
            className="shrink-0 inline-flex items-center gap-2 border-2 border-primary-500 px-[1.2rem] py-[.6rem] rounded-[10rem] font-sans text-[1.5rem] leading-8 text-primary-500 bg-primary-50 cursor-pointer"
          >
            <Copy size="20" color="#e45b00" variant="Bulk" aria-hidden />
            {t("share_dialog.copy")}
          </motion.button>
        </div>
        <div className="hidden">
          <QRCodeCanvas
            ref={canvasRef}
            value={eventLink}
            size={400}
            level="H"
            imageSettings={{
              src: "/logo-simple-orange.svg",
              height: 80,
              width: 80,
              excavate: true,
            }}
          />
        </div>
        <ul className="flex flex-wrap items-center justify-center gap-[1.2rem] lg:gap-[2rem]">
          {socials.map((s, i) => (
            <motion.li
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1 + i * 0.04 }}
            >
              {s.href ? (
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className={roundButton}
                >
                  <Image src={s.icon} alt="" width={22} height={22} />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={s.onClick}
                  aria-label={s.label}
                  title={s.label}
                  className={roundButton}
                >
                  <Image src={s.icon} alt="" width={22} height={22} />
                </button>
              )}
            </motion.li>
          ))}
          <motion.li
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.3 }}
          >
            <button
              type="button"
              onClick={handleDownloadQR}
              aria-label={t("share_dialog.qr")}
              title={t("share_dialog.qr")}
              className={roundButton}
            >
              <QrCode size={20} color="#2E3237" aria-hidden />
            </button>
          </motion.li>
          <motion.li
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.34 }}
          >
            <EventPosterGenerator event={event} />
          </motion.li>
        </ul>
      </ModalShell>
    </Dialog>
  );
}
