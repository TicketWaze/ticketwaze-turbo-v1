"use client";

import { useRef } from "react";
import Image, { type StaticImageData } from "next/image";
import { motion } from "motion/react";
import { toast } from "sonner";
import { CloseCircle, Copy } from "iconsax-reactjs";
import { QrCode } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import type { Event } from "@ticketwaze/typescript-config";
import Whatsapp from "../assets/icons/whatsApp.svg";
import Twitter from "../assets/icons/twitter.svg";
import Linkedin from "../assets/icons/linkedIn.svg";
import Instagram from "../assets/icons/instagram.svg";
import Tiktok from "../assets/icons/tiktok.svg";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./dialog";
import EventPosterGenerator from "./EventPosterGenerator";
import { shareCopy } from "./messages";
import { shareMessages } from "./shareText";

/** Where a share went, as the API's engagement tracking names it. */
export type ShareChannel = "copy" | "whatsapp" | "x" | "linkedin" | "native";

const ease = [0.22, 1, 0.36, 1] as const;
const roundButton =
  "flex items-center justify-center w-[4.5rem] h-[4.5rem] bg-neutral-100 rounded-full cursor-pointer transition-colors hover:bg-neutral-200";

/**
 * The share modal of every app — the organisation dashboard's "Share Event"
 * (Figma 1626:49207, mobile 2220:56118): the link with a copy button, then
 * X, LinkedIn, Instagram, TikTok, WhatsApp, a QR code download and, for an
 * event, the Instagram poster.
 *
 * WhatsApp and X are prefilled with the activity's name and an excerpt of its
 * own description (see shareText), not a generic invite.
 *
 * Controlled: the caller owns the trigger and the open state.
 */
export default function ShareDialog({
  open,
  onOpenChange,
  link,
  title,
  description,
  locale,
  event,
  fileName,
  onShare,
  kind = "activity",
}: {
  /** "profile" for an organisation page: its own heading and fallback text. */
  kind?: "activity" | "profile";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The public URL being shared; also what the QR code encodes. */
  link: string;
  /** The activity's name, heading the share message. */
  title?: string;
  /** The activity's description (rich-text HTML is fine). */
  description?: string | null;
  /** The UI language of the modal's own copy. */
  locale: string;
  /** Set when sharing an event: adds the Instagram poster button. */
  event?: Event;
  /** Base name of the downloaded QR code; defaults to the link's last segment. */
  fileName?: string;
  /** Told about each share, e.g. for the organiser's share count. */
  onShare?: (channel: ShareChannel) => void;
}) {
  const t = shareCopy(locale);
  const profile = kind === "profile";
  const heading = profile ? t.profileTitle : t.title;
  const intro = profile ? t.profileDescription : t.description;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const message = shareMessages({
    title,
    description,
    link,
    fallback: profile ? t.profileFallback : t.fallback,
  });
  const baseName =
    fileName ?? link.split("?")[0]!.split("/").filter(Boolean).pop() ?? "ticketwaze";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      onShare?.("copy");
      return true;
    } catch {
      toast.error(t.copyFailed);
      return false;
    }
  }

  function handleDownloadQR() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${baseName}-qrcode.png`;
    a.click();
  }

  /* Instagram and TikTok have no web share link: the link goes on the
     clipboard and their site opens, so it can be pasted in a story or bio. */
  async function pasteInto(app: string, url: string) {
    if (await copyLink()) toast.success(t.pasteHint(app));
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const socials: {
    label: string;
    icon: StaticImageData;
    href?: string;
    channel?: ShareChannel;
    onClick?: () => void;
  }[] = [
    {
      label: "X",
      icon: Twitter,
      channel: "x",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message.x)}`,
    },
    {
      label: "LinkedIn",
      icon: Linkedin,
      channel: "linkedin",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
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
      channel: "whatsapp",
      href: `https://wa.me/?text=${encodeURIComponent(message.whatsapp)}`,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col max-h-[calc(100dvh-3.2rem)] w-[calc(100vw-3.2rem)] max-w-[52rem] lg:w-[52rem] p-[2rem] lg:p-[3rem] gap-0 rounded-[2rem] border-none"
      >
        <div className="shrink-0 flex items-center justify-between gap-4 pb-[1.5rem] border-b border-neutral-100">
          <DialogTitle className="font-primary font-medium text-[2rem] lg:text-[2.6rem] leading-12 text-black">
            {heading}
          </DialogTitle>
          <DialogClose
            aria-label="Close"
            className="w-[3.5rem] h-[3.5rem] shrink-0 rounded-full bg-neutral-100 flex items-center justify-center cursor-pointer transition-colors hover:bg-neutral-200"
          >
            <CloseCircle size="20" variant="Bulk" color="#2E3237" aria-hidden />
          </DialogClose>
        </div>
        <motion.div
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col items-center gap-[2.5rem] pt-[2.5rem] min-w-0 w-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease, delay: 0.05 }}
        >
          <DialogDescription className="font-sans text-[1.5rem] lg:text-[1.8rem] leading-[2.5rem] text-neutral-400 text-center max-w-[44rem]">
            {intro}
          </DialogDescription>
          <div className="w-full flex items-center gap-4 border border-neutral-100 rounded-[10rem] p-[.6rem] pl-[1.5rem] shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            <span className="flex-1 min-w-0 truncate font-sans text-[1.5rem] lg:text-[1.8rem] leading-10 text-neutral-700">
              {link}
            </span>
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={async () => {
                if (await copyLink()) toast.success(t.copied);
              }}
              className="shrink-0 inline-flex items-center gap-2 border-2 border-primary-500 px-[1.2rem] py-[.6rem] rounded-[10rem] font-sans text-[1.5rem] leading-8 text-primary-500 bg-primary-50 cursor-pointer"
            >
              <Copy size="20" color="#e45b00" variant="Bulk" aria-hidden />
              {t.copy}
            </motion.button>
          </div>
          <div className="hidden">
            <QRCodeCanvas
              ref={canvasRef}
              value={link}
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
                    onClick={() => s.channel && onShare?.(s.channel)}
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
                aria-label={t.qr}
                title={t.qr}
                className={roundButton}
              >
                <QrCode size={20} color="#2E3237" aria-hidden />
              </button>
            </motion.li>
            {event && (
              <motion.li
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.34 }}
              >
                <EventPosterGenerator event={event} link={link} locale={locale} />
              </motion.li>
            )}
          </ul>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
