/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { Event } from "@ticketwaze/typescript-config";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CloseCircle, Scanner, TickCircle, Warning2 } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { CheckInWithQrCode, CheckInWithTicketID } from "@/actions/EventActions";
import { usePathname } from "@/i18n/navigation";
import PageLoader from "@/components/PageLoader";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { DateTime } from "luxon";

type ScanResult = Awaited<ReturnType<typeof CheckInWithQrCode>>;
type Mode = "qr" | "ticket_id";

function getCheckingWindowStatus(event: Event): {
  status: "open" | "too_early" | "closed";
  opensAt?: string;
} {
  const sorted = [...event.eventDays].sort((a, b) => a.dayNumber - b.dayNumber);
  const firstDay = sorted[0];
  const lastDay = sorted[sorted.length - 1];
  if (!firstDay || !lastDay) return { status: "closed" };

  const firstDate = DateTime.fromISO(firstDay.eventDate, { zone: "utc" })
    .setZone(firstDay.timezone, { keepLocalTime: true })
    .toISODate();
  const lastDate = DateTime.fromISO(lastDay.eventDate, { zone: "utc" })
    .setZone(lastDay.timezone, { keepLocalTime: true })
    .toISODate();

  const checkingOpens = DateTime.fromISO(`${firstDate}T${firstDay.startTime}`, {
    zone: firstDay.timezone,
  }).minus({ hours: 1 });

  const checkingCloses = DateTime.fromISO(`${lastDate}T${lastDay.endTime}`, {
    zone: lastDay.timezone,
  });

  if (!checkingOpens.isValid || !checkingCloses.isValid)
    return { status: "closed" };

  const now = DateTime.now();
  if (now < checkingOpens) {
    return { status: "too_early", opensAt: checkingOpens.toFormat("HH:mm") };
  }
  if (now > checkingCloses) return { status: "closed" };
  return { status: "open" };
}

export default function CheckingDialog({ event }: { event: Event }) {
  const t = useTranslations("Events.single_event");
  const closeRef = useRef<HTMLButtonElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("qr");
  const [isScanning, setIsScanning] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [ticketIdInput, setTicketIdInput] = useState("");
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const isCleaningRef = useRef(false);
  const pathname = usePathname();
  const locale = useLocale();

  async function CheckQrCode(id: string) {
    setIsLoading(true);
    setIsScanning(false);
    const response = await CheckInWithQrCode(event.eventId, pathname, id, locale);
    setScanResult(response);
    setIsLoading(false);
  }

  async function submitTicketId() {
    const id = ticketIdInput.trim();
    if (!id) return;
    const win = getCheckingWindowStatus(event);
    if (win.status === "too_early") {
      setScanResult({
        status: "failed",
        message: t("scanner.too_early", { time: win.opensAt ?? "" }),
      });
      return;
    }
    if (win.status === "closed") {
      setScanResult({ status: "failed", message: t("scanner.closed") });
      return;
    }
    setIsLoading(true);
    const response = await CheckInWithTicketID(
      event.eventId,
      pathname,
      id,
      locale,
    );
    setScanResult(response);
    setTicketIdInput("");
    setIsLoading(false);
  }

  const cleanupScanner = async () => {
    if (isCleaningRef.current) return;
    isCleaningRef.current = true;

    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
      } catch (error) {
        if (
          !(error instanceof Error && error.toString().includes("transition"))
        ) {
          console.error("Error clearing scanner:", error);
        }
      }
      scannerRef.current = null;
    }

    setTimeout(() => {
      const readerContainer = document.getElementById("reader-container");
      if (readerContainer) {
        readerContainer.innerHTML = "";
      }
      isCleaningRef.current = false;
    }, 100);
  };

  useEffect(() => {
    if (!isDialogOpen) {
      cleanupScanner();
      setIsScanning(false);
      setScanResult(null);
      setMode("qr");
      setTicketIdInput("");
      return;
    }

    if (!isScanning) {
      cleanupScanner();
      return;
    }

    const timer = setTimeout(() => {
      if (scannerRef.current) return;

      const scanner = new Html5QrcodeScanner(
        "reader",
        {
          qrbox: { width: 250, height: 250 },
          fps: 5,
          aspectRatio: 1.0,
          videoConstraints: {
            facingMode: { ideal: "environment" },
          },
        },
        false,
      );

      scannerRef.current = scanner;

      async function success(result: string) {
        setIsScanning(false);
        await CheckQrCode(result);
        setScannerKey((prev) => prev + 1);
      }

      function error() {}

      scanner.render(success, error);
    }, 150);

    return () => {
      clearTimeout(timer);
      cleanupScanner();
    };
  }, [isDialogOpen, isScanning, scannerKey]);

  function switchMode(newMode: Mode) {
    if (newMode === mode) return;
    setIsScanning(false);
    setScanResult(null);
    setTicketIdInput("");
    setMode(newMode);
  }

  function startScanning() {
    const win = getCheckingWindowStatus(event);
    if (win.status === "too_early") {
      setScanResult({
        status: "failed",
        message: t("scanner.too_early", { time: win.opensAt ?? "" }),
      });
      return;
    }
    if (win.status === "closed") {
      setScanResult({ status: "failed", message: t("scanner.closed") });
      return;
    }
    setScanResult(null);
    setScannerKey((prev) => prev + 1);
    setIsScanning(true);
  }

  function stopScanning() {
    setIsScanning(false);
    setScannerKey((prev) => prev + 1);
  }

  function handleScanNext() {
    setScanResult(null);
    if (mode === "qr") {
      startScanning();
    }
  }

  const showToggle = !isScanning && !scanResult;

  return (
    <>
      <PageLoader isLoading={isLoading} />
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild className="w-full lg:w-fit">
          <ButtonPrimary className="gap-4">
            <Scanner variant={"Bulk"} color={"#fff"} size={20} />
            {t("check_in")}
          </ButtonPrimary>
        </DialogTrigger>
        <DialogContent className={"w-[360px] lg:w-[520px]"}>
          <DialogHeader>
            <DialogTitle
              className={`font-medium border-b border-neutral-100 pb-[2rem] text-[2.6rem] leading-12 text-black font-primary ${(isScanning || scanResult) && "hidden"}`}
            >
              {t("check_in")}
            </DialogTitle>
            <DialogDescription className={"sr-only"}>
              <span>User checkIn</span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col w-auto justify-center items-center gap-[30px]">
            {/* Mode toggle */}
            {showToggle && (
              <div className="flex w-full bg-neutral-100 rounded-full p-1">
                <button
                  onClick={() => switchMode("qr")}
                  className={`flex-1 py-[8px] rounded-full text-[1.4rem] font-medium transition-colors ${
                    mode === "qr"
                      ? "bg-white text-black shadow-sm"
                      : "text-neutral-500"
                  }`}
                >
                  {t("scanner.tab_qr")}
                </button>
                <button
                  onClick={() => switchMode("ticket_id")}
                  className={`flex-1 py-[8px] rounded-full text-[1.4rem] font-medium transition-colors ${
                    mode === "ticket_id"
                      ? "bg-white text-black shadow-sm"
                      : "text-neutral-500"
                  }`}
                >
                  {t("ticketID")}
                </button>
              </div>
            )}

            {/* <p
              className={`font-sans text-[1.8rem] leading-[25px] text-[#cdcdcd] text-center w-[320px] lg:w-full ${(isScanning || scanResult) && "hidden"}`}
            >
              {mode === "qr" ? t("check_in_description") : t("scanner.id_description")}
            </p> */}

            <div
              className={`w-full max-w-[350px] ${mode === "ticket_id" ? "min-h-[140px]" : "min-h-[280px]"} flex items-center justify-center`}
            >
              {scanResult ? (
                <ScanResultView result={scanResult} />
              ) : mode === "ticket_id" ? (
                <div className="flex flex-col gap-4 w-full">
                  <div className="bg-neutral-100 rounded-[30px] flex items-center px-6 py-4">
                    <input
                      type="text"
                      value={ticketIdInput}
                      onChange={(e) => setTicketIdInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submitTicketId()}
                      placeholder={t("scanner.ticket_id_placeholder")}
                      className="text-black font-normal text-[1.4rem] leading-8 w-full outline-none bg-transparent"
                      autoFocus
                    />
                  </div>
                </div>
              ) : !isScanning ? (
                <div className="w-full h-[280px] border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Scanner
                      variant={"Bulk"}
                      color={"#737C8A"}
                      size={48}
                      className="mx-auto mb-4"
                    />
                    <p className="text-neutral-500 text-[1.6rem] font-medium">
                      {t("scanner.ready")}
                    </p>
                  </div>
                </div>
              ) : (
                <div id="reader-container" key={scannerKey} className="w-full">
                  <div
                    id="reader"
                    className="w-full
                      [&>div]:!border-0
                      [&>div]:!shadow-none
                      [&_video]:!rounded-lg
                      [&_#qr-shaded-region]:!border-2
                      [&_#qr-shaded-region]:!border-neutral-300
                      [&_#qr-shaded-region]:!rounded-lg
                      [&_button]:!bg-neutral-700
                      [&_button]:!text-white
                      [&_button]:!rounded-lg
                      [&_button]:!px-4
                      [&_button]:!py-2
                      [&_button]:!font-medium
                      [&_button]:hover:!bg-neutral-800
                      [&_button]:!transition-colors
                      [&_select]:!rounded-lg
                      [&_select]:!border-neutral-300
                      [&_select]:!px-3
                      [&_select]:!py-2
                    "
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            {scanResult ? (
              <ButtonPrimary onClick={handleScanNext} className="w-full">
                {t("scanner.scan_next")}
              </ButtonPrimary>
            ) : mode === "ticket_id" ? (
              <ButtonPrimary
                onClick={submitTicketId}
                disabled={isLoading || !ticketIdInput.trim()}
                className="w-full"
              >
                {isLoading ? <LoadingCircleSmall /> : t("check_in")}
              </ButtonPrimary>
            ) : isScanning ? (
              <ButtonPrimary
                onClick={stopScanning}
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {isLoading ? <LoadingCircleSmall /> : t("scanner.stop")}
              </ButtonPrimary>
            ) : (
              <ButtonPrimary
                onClick={startScanning}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? <LoadingCircleSmall /> : t("scanner.start")}
              </ButtonPrimary>
            )}
            <DialogClose ref={closeRef} className="sr-only"></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TicketInfo({
  ticket,
}: {
  ticket: { fullName: string; ticketName: string; ticketType: string };
}) {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="font-semibold text-[1.8rem] leading-8 text-neutral-800">
        {ticket.fullName}
      </span>
      <span className="text-[1.4rem] text-neutral-500">
        {ticket.ticketName}
      </span>
      <span className="uppercase text-[1.1rem] font-bold px-3 py-1 rounded-full bg-white border border-neutral-200 text-[#EF1870]">
        {ticket.ticketType}
      </span>
    </div>
  );
}

function ScanResultView({ result }: { result: ScanResult }) {
  const t = useTranslations("Events.single_event.scanner");

  if (result.status === "success") {
    return (
      <div className="flex flex-col items-center gap-6 p-6 bg-green-50 rounded-2xl border border-green-200 w-full">
        <TickCircle size={52} color="#16a34a" variant="Bulk" />
        <span className="text-green-700 font-semibold text-[2rem] leading-8">
          {t("success")}
        </span>
        {result.ticket && <TicketInfo ticket={result.ticket} />}
      </div>
    );
  }

  if (result.status === "already_checked") {
    return (
      <div className="flex flex-col items-center gap-6 p-6 bg-yellow-50 rounded-2xl border border-yellow-200 w-full">
        <Warning2 size={52} color="#d97706" variant="Bulk" />
        <span className="text-yellow-700 font-semibold text-[2rem] leading-8">
          {t("already_checked")}
        </span>
        {result.ticket && <TicketInfo ticket={result.ticket} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-red-50 rounded-2xl border border-red-200 w-full">
      <CloseCircle size={52} color="#dc2626" variant="Bulk" />
      <span className="text-red-700 font-semibold text-[2rem] leading-8">
        {t("failed")}
      </span>
      <p className="text-[1.4rem] text-neutral-600 text-center leading-7">
        {result.message}
      </p>
    </div>
  );
}
