"use client";
import { useRef, useState } from "react";
import UpcomingTicket from "./UpcomingTicket";
import {
  ArrowLeft2,
  ArrowRight2,
  DocumentDownload,
  Warning2,
} from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { QRCodeCanvas } from "qrcode.react";
import { domToPng } from "modern-screenshot";
import FormatDate from "@/lib/FormatDate";
import TimesTampToDateTime from "@/lib/TimesTampToDateTime";
import Image from "next/image";
import Logo from "@ticketwaze/ui/assets/images/logo-simple-orange.svg";
import { Event, Ticket } from "@ticketwaze/typescript-config";
import Capitalize from "@/lib/Capitalize";

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

  const mockTickets = tickets;

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

  const ticketRef = useRef<HTMLDivElement>(null);

  const downloadImage = async () => {
    if (!ticketRef.current) return;

    try {
      const element = ticketRef.current;
      const parent = element.parentElement;

      // Temporarily make visible for capture
      if (parent) {
        parent.style.position = "fixed";
        parent.style.left = "0";
        parent.style.top = "0";
        parent.style.opacity = "1";
        parent.style.zIndex = "9999";
      }

      // Wait for rendering
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Convert to PNG using modern-screenshot
      const dataUrl = await domToPng(element, {
        scale: 2,
        quality: 1,
      });

      // Hide element again
      if (parent) {
        parent.style.position = "absolute";
        parent.style.left = "-9999px";
        parent.style.opacity = "0";
        parent.style.zIndex = "auto";
      }

      // Generate filename and download
      const ticketName = tickets[currentIndex].ticketName || "ticket";
      const eventName = event.eventName?.replace(/[^a-z0-9]/gi, "_") || "event";
      const filename = `${eventName}_${ticketName}.png`;

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error generating PNG:", error);
      alert("Failed to download ticket. Please try again.");
    }
  };

  return (
    <>
      <UpcomingTicket ticket={tickets[currentIndex]} event={event} />

      <div className="absolute -left-[9999px] opacity-0 pointer-events-none">
        <div
          ref={ticketRef}
          className="bg-white shadow-lg p-6 rounded-xl w-full text-center flex flex-col gap-8 items-center"
        >
          <div
            className={
              "w-full h-[250px] lg:h-[296px] relative  bg-neutral-100 p-[15px] pt-0 text-center font-mono text-[1.4rem] flex flex-col justify-between items-center "
            }
          >
            <Image
              src={Logo}
              alt="Ticketwaze"
              className="absolute w-full h-full opacity-10"
            />
            <div
              className={
                "flex items-center justify-between pt-[15px] gap-4 w-full"
              }
            >
              <span className="text-neutral-600">
                1x {Capitalize(tickets[currentIndex].ticketType)}
              </span>
              {isFree ? (
                <span className="text-deep-100 font-medium">{t("free")}</span>
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
              <div className={"flex items-center justify-between gap-4 w-full"}>
                <span className="text-neutral-600">{t("email")}</span>
                <span className="text-deep-100 font-medium">
                  {tickets[currentIndex].email}
                </span>
              </div>
              <div className="h-[2px] w-full rounded-[10px] bg-neutral-200"></div>
              <div className={"flex items-center justify-between gap-4 w-full"}>
                <span className="text-neutral-600">{t("date")}</span>
                <span className="text-deep-100 font-medium">
                  {FormatDate(event.eventDays[0].dateTime)}
                </span>
              </div>
              <div className={"flex items-center justify-between gap-4 w-full"}>
                <span className="text-neutral-600">{t("time")}</span>
                <span className="text-deep-100 font-medium">
                  {`${TimesTampToDateTime(event.eventDays[0]?.dateTime ?? "").hour < 10 ? `0${TimesTampToDateTime(event.eventDays[0]?.dateTime ?? "").hour}` : TimesTampToDateTime(event.eventDays[0]?.dateTime ?? "").hour}:${TimesTampToDateTime(event.eventDays[0]?.dateTime ?? "").minute < 10 ? `0${TimesTampToDateTime(event.eventDays[0]?.dateTime ?? "").minute}` : TimesTampToDateTime(event.eventDays[0]?.dateTime ?? "").minute}`}
                </span>
              </div>
              <div className={"flex items-center justify-between gap-4 w-full"}>
                <span className="text-neutral-600">{t("location")}</span>
                <span className="text-deep-100 font-medium text-right">
                  {event.address}
                </span>
              </div>
            </div>
          </div>
          <span className="text-warning flex gap-4 items-center">
            <Warning2 size="16" color="#ea961c" variant="TwoTone" />
            {t("ticketWarning1")}{" "}
            {!event.eventTicketTypes[0].isRefundable && t("ticketWarning2")}
          </span>
          <QRCodeCanvas
            value={tickets[currentIndex].ticketId}
            size={128}
            level="H"
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
        <button
          onClick={downloadImage}
          className="border-2 cursor-pointer border-primary-500 px-12 py-[7.5px] bg-[#FFEFE2] rounded-[100px] flex gap-4 items-center justify-center"
        >
          <DocumentDownload
            variant="Bulk"
            size={20}
            color="#E45B00"
            className="hidden lg:block"
          />
          <span className="text-[1.5rem] text-primary-500">
            {t("download")}
          </span>
        </button>
      </div>
    </>
  );
}
