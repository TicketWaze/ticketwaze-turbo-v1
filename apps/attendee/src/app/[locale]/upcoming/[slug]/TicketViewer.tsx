/* eslint-disable react-hooks/rules-of-hooks */
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import UpcomingTicket from "./UpcomingTicket";
import {
  ArrowLeft2,
  ArrowRight2,
  DocumentDownload,
  Warning2,
} from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";
import { domToBlob } from "modern-screenshot";
import FormatDate from "@/lib/FormatDate";
import Image from "next/image";
import Logo from "@ticketwaze/ui/assets/images/logo-simple-orange.svg";
import { Event, Ticket } from "@ticketwaze/typescript-config";
import Capitalize from "@/lib/Capitalize";
import formatTime from "@/lib/formatTime";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * How the rendered ticket reaches the phone. A web page cannot write to the
 * iOS Photos library by itself, so each platform gets the closest thing:
 *
 * - iOS: the share sheet, whose "Save Image" puts it straight into Photos.
 *   `<a download>` there lands in the Files app — which is where "I downloaded
 *   it and see nothing" came from.
 * - In-app browsers (Instagram, Facebook, TikTok…): downloads of blob/data
 *   URLs are dropped silently, so the image is shown instead, to press-and-hold.
 * - Everything else: a normal file download.
 */
function isIOS() {
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS reports itself as a Mac.
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  );
}

function isInAppBrowser() {
  return /FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|TikTok|musical_ly|Twitter|MicroMessenger|; wv\)/i.test(
    navigator.userAgent,
  );
}

export default function TicketViewer({
  tickets,
  event,
}: {
  tickets: Ticket[];
  event: Event;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const t = useTranslations("Event");
  const isFree =
    tickets[currentIndex].ticketPrice === 0 ||
    tickets[currentIndex].ticketUsdPrice === 0;
  /**
   * A giveaway is priced at 0 too, so it must be checked BEFORE `isFree` —
   * otherwise the holder is told their ticket was free when Ticketwaze bought
   * it for them.
   */
  const priceLabel = tickets[currentIndex].isGiveaway
    ? t("giveaway")
    : // A reward the ORGANISER gave for buying several tickets. Priced at 0 as
      // well, and checked before `isFree` for the same reason.
      tickets[currentIndex].source === "reward"
      ? t("reward")
      : isFree
        ? t("free")
        : null;

  const mockTickets = tickets;

  const ticketRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState<{
    url: string;
    filename: string;
  } | null>(null);
  /*
   * The PNG for the ticket on screen, started as soon as it is shown. Rendering
   * takes a second or two on a phone, and Safari only lets `navigator.share`
   * run shortly after the tap — rendering on click would lose that window and
   * the share would be refused.
   */
  const rendered = useRef<{ index: number; blob: Promise<Blob> } | null>(null);

  const renderTicket = useCallback((index: number) => {
    if (rendered.current?.index === index) return rendered.current.blob;
    const blob = (async () => {
      if (!ticketRef.current) throw new Error("Ticket not mounted");
      await document.fonts?.ready;
      const result = await domToBlob(ticketRef.current, {
        scale: 2,
        type: "image/png",
        backgroundColor: "#FFFFFF",
      });
      if (!result || result.size === 0) throw new Error("Empty render");
      return result;
    })();
    rendered.current = { index, blob };
    // A failed render must not be cached, or every later tap fails the same way.
    blob.catch(() => {
      if (rendered.current?.blob === blob) rendered.current = null;
    });
    return blob;
  }, []);

  useEffect(() => {
    // Wait a frame so the hidden ticket shows the new index before capture.
    const id = requestAnimationFrame(() => {
      renderTicket(currentIndex).catch(() => {});
    });
    return () => cancelAnimationFrame(id);
  }, [currentIndex, renderTicket]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mockTickets.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < mockTickets.length - 1 ? prev + 1 : 0));
  };

  if (mockTickets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-lg">No tickets available</p>
      </div>
    );
  }

  const locale = useLocale();
  const { data: session } = useSession();
  const [isFetchingDocument, setIsFetchingDocument] = useState(false);

  /*
   * The attached document, if this event has one.
   *
   * `documentAvailableAt` is resolved by the API from the event's days and its
   * timezone, and the download endpoint enforces the identical comparison. It
   * is read rather than recomputed so the button and the server cannot disagree
   * — a button that looks live and then refuses is worse than one that waits.
   */
  const isOnline = event.eventCategory === "meet";
  const hasDocument = Boolean(event.eventDocument);
  const availableAt = event.documentAvailableAt
    ? new Date(event.documentAvailableAt)
    : null;
  const documentUnlocked = availableAt !== null && availableAt <= new Date();
  const documentReady = hasDocument && documentUnlocked;
  const availableAtLabel = availableAt
    ? availableAt.toLocaleString(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  /**
   * Swap a short-lived presigned URL for the file.
   *
   * The URL is minted per click and expires in minutes, which is what keeps a
   * copied link from becoming a public download. Navigating to it is enough:
   * the API signs it with a Content-Disposition attachment header, so the
   * browser saves it under the organiser's filename rather than rendering it.
   */
  const downloadDocument = async () => {
    if (!documentReady || isFetchingDocument) return;
    setIsFetchingDocument(true);
    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${event.eventId}/document/download`,
        {
          headers: {
            Authorization: `Bearer ${session?.user.accessToken}`,
            "Accept-Language": locale,
          },
        },
      );
      const response = await request.json();
      if (response.status !== "success" || !response.data?.downloadUrl) {
        toast.error(response.message ?? t("document.failed"));
        return;
      }
      window.location.href = response.data.downloadUrl;
    } catch {
      toast.error(t("document.failed"));
    } finally {
      setIsFetchingDocument(false);
    }
  };

  const downloadImage = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const ticketName = tickets[currentIndex].ticketName || "ticket";
    const eventName = event.eventName?.replace(/[^a-z0-9]/gi, "_") || "event";
    const filename = `${eventName}_${ticketName}.png`;

    try {
      const blob = await renderTicket(currentIndex);
      const file = new File([blob], filename, { type: "image/png" });

      if (isInAppBrowser()) {
        setPreview({ url: URL.createObjectURL(blob), filename });
        return;
      }

      if (isIOS()) {
        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file] });
            return;
          } catch (error) {
            // The holder closed the sheet: nothing to do.
            if ((error as DOMException)?.name === "AbortError") return;
            // Anything else (e.g. the tap expired): fall back to the preview.
          }
        }
        setPreview({ url: URL.createObjectURL(blob), filename });
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = filename;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (error) {
      console.error("Error generating PNG:", error);
      toast.error(t("ticketDownload.failed"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <UpcomingTicket ticket={tickets[currentIndex]} event={event} />

      {/*
        Parked off-screen and always rendered, so nothing is toggled at capture
        time — the old toggle left the ticket pinned over the page whenever a
        capture threw. Fixed width so every phone gets the same image.
      */}
      <div aria-hidden className="fixed -left-[9999px] top-0 pointer-events-none">
        <div
          ref={ticketRef}
          className="bg-white p-6 rounded-xl w-[400px] text-center flex flex-col gap-8 items-center"
        >
          <div
            className={
              `w-full h-auto relative  ${tickets[currentIndex].source === "reward" ? "perk-border" : "bg-neutral-100"} p-[15px] pt-0 text-center font-mono text-[1.4rem] flex flex-col  items-center `
            }
          >
            <Image
              src={Logo}
              alt="Ticketwaze"
              // Off-screen, a lazy image never loads — and never shows in the PNG.
              loading="eager"
              className="absolute w-full h-full opacity-10"
            />
            <div
              className={
                "flex items-center justify-between pt-[15px] gap-4 pb-4 w-full"
              }
            >
              <span className="text-neutral-600">
                1x {Capitalize(tickets[currentIndex].ticketType)}
              </span>
              {priceLabel ? (
                <span className="text-deep-100 font-medium">{priceLabel}</span>
              ) : (
                `${event.currency === "USD" ? tickets[currentIndex].ticketUsdPrice : tickets[currentIndex].ticketPrice} ${event.currency}`
              )}
            </div>
            <div className="flex flex-col gap-4 w-full">
              <div className="h-[2px] w-full rounded-[10px] bg-neutral-200"></div>
              <div className={"flex items-center justify-between gap-4 w-full"}>
                <span className="text-neutral-600">{t("ticketId")}</span>
                <span className="text-primary-500 font-medium">
                  {tickets[currentIndex].ticketName}
                </span>
              </div>
              <div className={"flex items-center justify-between gap-4 w-full"}>
                <span className="text-neutral-600">{t("name")}</span>
                <span className="text-deep-100 font-medium">
                  {tickets[currentIndex].fullName}
                </span>
              </div>
              <div className="h-[2px] w-full rounded-[10px] bg-neutral-200"></div>
              <div className={"flex items-center justify-between gap-4 w-full"}>
                <span className="text-neutral-600">{t("date")}</span>
                <span className="text-deep-100 font-medium">
                  {FormatDate(
                    event.eventDays.filter((day) => day.dayNumber === 1)[0]
                      .eventDate,
                    locale,
                    event.eventDays.filter((day) => day.dayNumber === 1)[0]
                      .timezone,
                  )}
                </span>
              </div>
              <div className={"flex items-center justify-between gap-4 w-full"}>
                <span className="text-neutral-600">{t("time")}</span>
                <span className="text-deep-100 font-medium">
                  {formatTime(
                    event.eventDays.filter((day) => day.dayNumber === 1)[0]
                      .startTime,
                    event.eventDays.filter((day) => day.dayNumber === 1)[0]
                      .timezone,
                    locale,
                  )}{" "}
                  -{" "}
                  {formatTime(
                    event.eventDays.filter((day) => day.dayNumber === 1)[0]
                      .endTime,
                    event.eventDays.filter((day) => day.dayNumber === 1)[0]
                      .timezone,
                    locale,
                  )}
                </span>
              </div>
              {event.eventCategory !== "meet" && (
                <div
                  className={"flex items-center justify-between gap-4 w-full"}
                >
                  <span className="text-neutral-600">{t("location")}</span>
                  <span className="text-deep-100 font-medium text-right">
                    {event.address}
                  </span>
                </div>
              )}
            </div>
          </div>
          <span className="text-warning flex gap-4 items-center">
            <Warning2 size="16" color="#ea961c" variant="TwoTone" />
            {t("ticketWarning1")}{" "}
            {!event.eventTicketTypes[0].isRefundable && t("ticketWarning2")}
          </span>
          {/*
            Built for the door scanner. UPPERCASE fits the UUID into a smaller
            version-4 code (alphanumeric mode) at the same H error correction,
            and the 4-module quiet zone is what lets a camera find the code
            against a dark phone screen — without it, a decode test under noise
            succeeded 4 times in 25. The scanner lowercases the id back.
          */}
          <QRCodeCanvas
            value={tickets[currentIndex].ticketId.toUpperCase()}
            size={300}
            level="H"
            marginSize={4}
            bgColor="#FFFFFF"
            fgColor="#000000"
            imageSettings={{
              src: "/logo-simple-orange.svg",
              height: 52,
              width: 52,
              excavate: true,
            }}
          />
        </div>
      </div>

      <div className="border border-neutral-100 rounded-[100px] py-4 px-[1.5rem] flex justify-between">
        <div className="flex items-center gap-[18px]">
          <button
            onClick={goToPrevious}
            disabled={mockTickets.length <= 1}
            className="w-[35px] cursor-pointer h-[35px] disabled:cursor-not-allowed rounded-full bg-neutral-100 flex items-center justify-center"
          >
            <ArrowLeft2 variant="Bulk" size={20} color="#0D0D0D" />
          </button>
          <span className="text-[2.2rem] leading-12 text-neutral-600">
            <span className="text-primary-500">{currentIndex + 1}</span>/
            {mockTickets.length}
          </span>
          <button
            onClick={goToNext}
            disabled={mockTickets.length <= 1}
            className="w-[35px] cursor-pointer h-[35px] disabled:cursor-not-allowed rounded-full bg-neutral-100 flex items-center justify-center"
          >
            <ArrowRight2 variant="Bulk" size={20} color="#0D0D0D" />
          </button>
        </div>
        {/*
          One button, two jobs, decided by what kind of event this is.

          An online event has no scannable ticket image to save — which is why
          this button was disabled outright for `meet`. Where the organiser
          attached a document it becomes that download instead, so the button
          earns its place rather than sitting greyed out.
        */}
        <button
          onClick={isOnline ? downloadDocument : downloadImage}
          disabled={isOnline ? !documentReady || isFetchingDocument : isSaving}
          title={
            isOnline && hasDocument && !documentUnlocked
              ? t("document.lockedHint", { date: availableAtLabel })
              : undefined
          }
          className="border-2 cursor-pointer border-primary-500 disabled:border-neutral-700 px-12 py-[7.5px] bg-[#FFEFE2] disabled:bg-neutral-200 rounded-[100px] flex gap-4 items-center justify-center disabled:cursor-not-allowed text-primary-500 disabled:text-neutral-700"
        >
          <DocumentDownload
            variant="Bulk"
            size={20}
            color="#E45B00"
            className="hidden lg:block"
          />
          <span className="text-[1.5rem] ">
            {isOnline ? t("document.download") : t("download")}
          </span>
        </button>
      </div>

      <Dialog
        open={preview !== null}
        onOpenChange={(open) => !open && setPreview(null)}
      >
        <DialogContent className="w-[96vw] max-w-[440px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("ticketDownload.title")}</DialogTitle>
            <DialogDescription>{t("ticketDownload.hint")}</DialogDescription>
          </DialogHeader>
          {preview && (
            // A plain <img>: long-press "Save to Photos" needs a real image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.url}
              alt={preview.filename}
              className="w-full h-auto rounded-xl"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
