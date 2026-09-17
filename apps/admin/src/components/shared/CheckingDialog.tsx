"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { DateTime } from "luxon";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  CloseCircle,
  LoginCurve,
  LogoutCurve,
  Scanner,
  TickCircle,
  Warning2,
} from "iconsax-reactjs";
import type { Event } from "@ticketwaze/typescript-config";
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
import { ButtonAccent, ButtonBlack } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  ScanTicketAction,
  CheckInTicketAction,
  CheckOutTicketAction,
} from "@/actions/Checking";
import useAdminCan from "@/lib/useAdminCan";

type ScanResult = Awaited<ReturnType<typeof ScanTicketAction>>;
type ActionResult =
  | Awaited<ReturnType<typeof CheckInTicketAction>>
  | Awaited<ReturnType<typeof CheckOutTicketAction>>;
type Mode = "qr" | "ticket_id";

/**
 * Mirrors the API's `getCheckingWindowStatus` in `services/ticket_checking.ts`:
 * the window opens an hour before the first day's start time and closes at the
 * last day's end time, each in its own timezone.
 *
 * Only ever used to explain the answer without a round trip — the API decides.
 */
export function getCheckingWindowStatus(event: Event): {
  status: "open" | "too_early" | "closed";
  opensAt?: string;
} {
  const sorted = [...(event.eventDays ?? [])].sort(
    (a, b) => a.dayNumber - b.dayNumber,
  );
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

/**
 * Whether the scanner is offered on this activity at all.
 *
 * The same conditions the API's `loadEventForChecking` enforces — approved,
 * not an online meet, not being deleted, not already over — so the button is
 * only drawn where a scan would actually be accepted. Cancellation is checked
 * here too: a cancelled event's buyers have been refunded.
 */
export function canCheckActivity(event: Event): boolean {
  if (event.adminStatus !== "approved") return false;
  if (event.eventCategory === "meet") return false;
  if (event.cancelledAt) return false;
  if (
    event.deletionStatus === "pending_deletion" ||
    event.deletionStatus === "deleted"
  )
    return false;
  return getCheckingWindowStatus(event).status !== "closed";
}

function formatDuration(totalMinutes: number) {
  const m = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(m / 60);
  const mins = m % 60;
  if (h > 0) return `${h}h ${mins}m`;
  return `${mins}m`;
}

/**
 * THE TICKET SCANNER, IN THE ADMIN DASHBOARD.
 *
 * The same two-step flow the organisation dashboard runs — scan to see who the
 * ticket belongs to and whether they are inside, then check them in or out —
 * against `/admin/event/...`, which an admin's own permissions authorise. An
 * admin working the door of an event they do not own could not scan at all
 * before this; the organiser's endpoints ask for an organisation membership no
 * admin has.
 *
 * GATED ON `tickets.checking`, the same permission the API checks. Drawing the
 * button is only a convenience — the server re-checks every call.
 *
 * Accepts `open`/`onOpenChange` so the activity page can drive it from either
 * of its two triggers (the desktop header and the mobile row) without mounting
 * the camera twice.
 */
export default function CheckingDialog({
  event,
  open: openProp,
  onOpenChange,
  hideTrigger,
}: {
  event: Event;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
  const t = useTranslations("Activities.activity");
  const locale = useLocale();
  const pathname = usePathname();
  const { data: session } = useSession();
  const canCheck = useAdminCan("tickets.checking");
  const accessToken = session?.user.accessToken ?? "";

  const closeRef = useRef<HTMLButtonElement>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const isDialogOpen = openProp ?? internalOpen;
  function setDialogOpen(next: boolean) {
    setInternalOpen(next);
    onOpenChange?.(next);
  }

  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("qr");
  const [isScanning, setIsScanning] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  // Two-step flow: a scan produces a decision (scanResult); performing the
  // chosen action produces a confirmation (actionResult).
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);
  const [ticketIdInput, setTicketIdInput] = useState("");
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const isCleaningRef = useRef(false);

  async function scan(id: string) {
    setIsLoading(true);
    setIsScanning(false);
    const response = await ScanTicketAction(
      event.eventId,
      id,
      accessToken,
      locale,
    );
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
    await scan(id);
    setTicketIdInput("");
  }

  async function performCheckIn() {
    if (!scanResult || scanResult.status !== "success") return;
    setIsLoading(true);
    const response = await CheckInTicketAction(
      event.eventId,
      pathname,
      scanResult.ticket.ticketId,
      accessToken,
      locale,
    );
    setActionResult(response);
    setIsLoading(false);
  }

  async function performCheckOut() {
    if (!scanResult || scanResult.status !== "success") return;
    setIsLoading(true);
    const response = await CheckOutTicketAction(
      event.eventId,
      pathname,
      scanResult.ticket.ticketId,
      accessToken,
      locale,
    );
    setActionResult(response);
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
      if (readerContainer) readerContainer.innerHTML = "";
      isCleaningRef.current = false;
    }, 100);
  };

  useEffect(() => {
    if (!isDialogOpen) {
      cleanupScanner();
      setIsScanning(false);
      setScanResult(null);
      setActionResult(null);
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
          videoConstraints: { facingMode: { ideal: "environment" } },
        },
        false,
      );

      scannerRef.current = scanner;

      async function success(result: string) {
        setIsScanning(false);
        await scan(result);
        setScannerKey((prev) => prev + 1);
      }

      function error() {}

      scanner.render(success, error);
    }, 150);

    return () => {
      clearTimeout(timer);
      cleanupScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDialogOpen, isScanning, scannerKey]);

  function switchMode(newMode: Mode) {
    if (newMode === mode) return;
    setIsScanning(false);
    setScanResult(null);
    setActionResult(null);
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
    setScanResult(null);
    setActionResult(null);
    setScannerKey((prev) => prev + 1);
    setIsScanning(true);
  }

  function stopScanning() {
    setIsScanning(false);
    setScannerKey((prev) => prev + 1);
  }

  function handleScanNext() {
    setScanResult(null);
    setActionResult(null);
    if (mode === "qr") startScanning();
  }

  if (!canCheck) return null;

  const hasResult = !!scanResult || !!actionResult;
  const showToggle = !isScanning && !hasResult;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild className="w-full lg:w-fit">
          <ButtonBlack className="gap-3">
            <Scanner variant="Bulk" color="#ffffff" size={18} />
            {t("actions.scan")}
          </ButtonBlack>
        </DialogTrigger>
      )}
      <DialogContent className="w-[360px] lg:w-[520px] max-w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle
            className={`font-medium border-b border-neutral-100 pb-[2rem] text-[2.6rem] leading-12 text-black font-primary ${(isScanning || hasResult) && "hidden"}`}
          >
            {t("actions.scan")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            <span>{t("actions.scan")}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col w-auto justify-center items-center gap-[30px]">
          {/* Mode toggle */}
          {showToggle && (
            <div className="flex w-full bg-neutral-100 rounded-full p-1">
              <button
                onClick={() => switchMode("qr")}
                className={`flex-1 py-[8px] rounded-full text-[1.4rem] font-medium transition-colors cursor-pointer ${
                  mode === "qr"
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-500"
                }`}
              >
                {t("scanner.tab_qr")}
              </button>
              <button
                onClick={() => switchMode("ticket_id")}
                className={`flex-1 py-[8px] rounded-full text-[1.4rem] font-medium transition-colors cursor-pointer ${
                  mode === "ticket_id"
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-500"
                }`}
              >
                {t("scanner.tab_ticket_id")}
              </button>
            </div>
          )}

          <div
            className={`w-full max-w-[350px] ${mode === "ticket_id" && !hasResult ? "min-h-[140px]" : "min-h-[280px]"} flex items-center justify-center`}
          >
            {actionResult ? (
              <ActionResultView result={actionResult} />
            ) : scanResult ? (
              <ScanDecisionView result={scanResult} />
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
                    variant="Bulk"
                    color="#737C8A"
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

        <DialogFooter className="flex flex-col gap-2">
          {actionResult ? (
            <ButtonBlack onClick={handleScanNext} className="w-full">
              {t("scanner.scan_next")}
            </ButtonBlack>
          ) : scanResult ? (
            scanResult.status === "success" ? (
              <div className="flex flex-col gap-2 w-full">
                {scanResult.availableAction === "check_out" ? (
                  <ButtonBlack
                    onClick={performCheckOut}
                    disabled={isLoading}
                    className="w-full gap-4"
                  >
                    <LogoutCurve variant="Bulk" color="#ffffff" size={20} />
                    {t("scanner.check_out")}
                  </ButtonBlack>
                ) : (
                  <ButtonBlack
                    onClick={performCheckIn}
                    disabled={isLoading || !scanResult.canCheckIn}
                    className="w-full gap-4"
                  >
                    <LoginCurve variant="Bulk" color="#ffffff" size={20} />
                    {t("scanner.check_in")}
                  </ButtonBlack>
                )}
                <ButtonAccent onClick={handleScanNext} className="w-full">
                  {t("scanner.scan_next")}
                </ButtonAccent>
              </div>
            ) : (
              <ButtonBlack onClick={handleScanNext} className="w-full">
                {t("scanner.scan_next")}
              </ButtonBlack>
            )
          ) : mode === "ticket_id" ? (
            <ButtonBlack
              onClick={submitTicketId}
              disabled={isLoading || !ticketIdInput.trim()}
              className="w-full"
            >
              {isLoading ? <LoadingCircleSmall /> : t("scanner.validate")}
            </ButtonBlack>
          ) : isScanning ? (
            <ButtonBlack
              onClick={stopScanning}
              disabled={isLoading}
              className="w-full bg-failure hover:bg-failure"
            >
              {isLoading ? <LoadingCircleSmall /> : t("scanner.stop")}
            </ButtonBlack>
          ) : (
            <ButtonBlack
              onClick={startScanning}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <LoadingCircleSmall /> : t("scanner.start")}
            </ButtonBlack>
          )}
          <DialogClose ref={closeRef} className="sr-only"></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

/**
 * The decision view shown after a successful scan: ticket identity, current
 * presence, time already spent inside, and which action is available (the
 * button itself lives in the footer).
 */
function ScanDecisionView({ result }: { result: ScanResult }) {
  const t = useTranslations("Activities.activity.scanner");
  const locale = useLocale();

  if (result.status !== "success") {
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

  const inside = result.presence === "inside";
  const since = result.currentSessionCheckedInAt
    ? DateTime.fromISO(result.currentSessionCheckedInAt)
        .setLocale(locale)
        .toFormat("HH:mm")
    : null;

  return (
    <div
      className={`flex flex-col items-center gap-6 p-6 rounded-2xl border w-full ${
        inside
          ? "bg-green-50 border-green-200"
          : "bg-neutral-50 border-neutral-200"
      }`}
    >
      <span
        className={`uppercase text-[1.1rem] font-bold px-4 py-1 rounded-full ${
          inside
            ? "bg-green-100 text-green-700"
            : "bg-neutral-200 text-neutral-600"
        }`}
      >
        {inside ? t("inside") : t("outside")}
      </span>
      <TicketInfo ticket={result.ticket} />
      <div className="flex items-center justify-center gap-8 w-full pt-2 border-t border-neutral-200/70">
        <div className="flex flex-col items-center">
          <span className="text-[1.1rem] uppercase font-bold text-neutral-500">
            {t("time_inside")}
          </span>
          <span className="text-[1.6rem] font-semibold text-neutral-800">
            {formatDuration(result.totalMinutesInside)}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[1.1rem] uppercase font-bold text-neutral-500">
            {t("entries")}
          </span>
          <span className="text-[1.6rem] font-semibold text-neutral-800">
            {result.entriesCount}
          </span>
        </div>
      </div>
      {inside && since && (
        <p className="text-[1.3rem] text-neutral-500">
          {t("since", { time: since })}
        </p>
      )}
      {!inside && !result.canCheckIn && (
        <p className="text-[1.3rem] text-amber-600 text-center leading-7">
          {result.checkInWindow === "too_early"
            ? t("too_early", { time: result.opensAt ?? "" })
            : t("closed")}
        </p>
      )}
    </div>
  );
}

/** The confirmation view shown after a check-in or check-out completes. */
function ActionResultView({ result }: { result: ActionResult }) {
  const t = useTranslations("Activities.activity.scanner");

  if (result.status === "success") {
    const isCheckout = "sessionMinutes" in result;
    return (
      <div className="flex flex-col items-center gap-6 p-6 bg-green-50 rounded-2xl border border-green-200 w-full">
        <TickCircle size={52} color="#16a34a" variant="Bulk" />
        <span className="text-green-700 font-semibold text-[2rem] leading-8">
          {isCheckout ? t("checked_out") : t("checked_in")}
        </span>
        {result.ticket && <TicketInfo ticket={result.ticket} />}
        {isCheckout && (
          <div className="flex items-center justify-center gap-8 w-full pt-2 border-t border-green-200/70">
            <div className="flex flex-col items-center">
              <span className="text-[1.1rem] uppercase font-bold text-neutral-500">
                {t("stayed")}
              </span>
              <span className="text-[1.6rem] font-semibold text-neutral-800">
                {formatDuration(result.sessionMinutes)}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[1.1rem] uppercase font-bold text-neutral-500">
                {t("time_inside")}
              </span>
              <span className="text-[1.6rem] font-semibold text-neutral-800">
                {formatDuration(result.totalMinutesInside)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (result.status === "already_checked" || result.status === "not_inside") {
    return (
      <div className="flex flex-col items-center gap-6 p-6 bg-yellow-50 rounded-2xl border border-yellow-200 w-full">
        <Warning2 size={52} color="#d97706" variant="Bulk" />
        <span className="text-yellow-700 font-semibold text-[2rem] leading-8 text-center">
          {result.message}
        </span>
        {"ticket" in result && result.ticket && (
          <TicketInfo ticket={result.ticket} />
        )}
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
