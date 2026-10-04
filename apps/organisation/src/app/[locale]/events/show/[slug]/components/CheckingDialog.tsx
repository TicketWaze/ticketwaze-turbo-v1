"use client";
import { Event, Ticket } from "@ticketwaze/typescript-config";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Scanner } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { extractTicketCode } from "@/lib/ticketScanner";
import TicketCamera from "@/components/shared/TicketCamera";
import {
  ScanTicketAction,
  CheckInTicketAction,
  CheckOutTicketAction,
} from "@/actions/EventActions";
import { usePathname, useRouter } from "@/i18n/navigation";
import { ButtonPill } from "@/components/shared/buttons";
import { ease } from "@/components/shared/motion";
import { cn } from "@/lib/utils";
import SuccessBadge from "@/assets/images/auth/success-badge.png";
import { DateTime } from "luxon";
import { isOvernight } from "@/lib/eventTime";

type ScanResult = Awaited<ReturnType<typeof ScanTicketAction>>;
type TicketInfo = { fullName: string; ticketName: string; ticketType: string };

/**
 * What the panel shows. Scanning or typing an ID goes straight to "working",
 * then to a result; only a ticket that is currently INSIDE stops at "inside",
 * where the checker can record the attendee leaving.
 */
type View =
  | { kind: "idle" }
  | { kind: "camera" }
  | { kind: "working"; checkingOut?: boolean }
  | {
      kind: "inside";
      scan: Extract<ScanResult, { status: "success" }>;
    }
  | {
      kind: "done";
      checkedOut: boolean;
      ticket?: TicketInfo;
      totalMinutesInside?: number;
      entriesCount?: number;
      sessionMinutes?: number;
    }
  | { kind: "error"; title: string; message?: string; ticket?: TicketInfo };

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

  // An overnight last day (20:00 → 02:00) closes the next morning.
  const checkingCloses = DateTime.fromISO(`${lastDate}T${lastDay.endTime}`, {
    zone: lastDay.timezone,
  }).plus({ days: isOvernight(lastDay.startTime, lastDay.endTime) ? 1 : 0 });

  if (!checkingOpens.isValid || !checkingCloses.isValid)
    return { status: "closed" };

  const now = DateTime.now();
  if (now < checkingOpens) {
    return { status: "too_early", opensAt: checkingOpens.toFormat("HH:mm") };
  }
  if (now > checkingCloses) return { status: "closed" };
  return { status: "open" };
}

function formatDuration(totalMinutes: number) {
  const m = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(m / 60);
  const mins = m % 60;
  if (h > 0) return `${h}h ${mins}m`;
  return `${mins}m`;
}

const footerButton =
  "flex-1 h-[5rem] lg:h-[4.6rem] rounded-[10rem] border-2 font-sans font-semibold text-[1.5rem] leading-8 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const primaryFooter = `${footerButton} bg-primary-500 border-primary-600 text-white hover:bg-primary-600`;
const secondaryFooter = `${footerButton} bg-primary-50 border-primary-500 text-primary-500 hover:bg-primary-100`;

/**
 * The check-in side panel (Figma 1613:28605 → 1624:48008, mobile
 * 2220:53291…55047): the camera box and a ticket-ID field together, then a
 * single step to a result. Opening hours are enforced here as well as by the
 * API: check-in opens one hour before the first day and closes at the end of
 * the last.
 */
export default function CheckingDialog({
  event,
  tickets = [],
  triggerClassName,
}: {
  event: Event;
  /** The page's tickets, so a typed ticket name (TCK…) resolves to its id. */
  tickets?: Ticket[];
  triggerClassName?: string;
}) {
  const t = useTranslations("Events.single_event");
  const ts = useTranslations("Events.single_event.scanner");
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>({ kind: "idle" });
  /** Whether the last code came from the camera, so Continue reopens it. */
  const [fromCamera, setFromCamera] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const [ticketId, setTicketId] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  function windowError(): View | null {
    const win = getCheckingWindowStatus(event);
    if (win.status === "too_early")
      return {
        kind: "error",
        title: ts("not_open_title"),
        message: ts("too_early", { time: win.opensAt ?? "" }),
      };
    if (win.status === "closed")
      return {
        kind: "error",
        title: ts("not_open_title"),
        message: ts("closed"),
      };
    return null;
  }

  function openChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setView({ kind: "idle" });
      setTicketId("");
    }
  }

  function startCamera() {
    const blocked = windowError();
    if (blocked) {
      setView(blocked);
      return;
    }
    setScannerKey((k) => k + 1);
    setView({ kind: "camera" });
  }

  /** Scan → check in, in one go. Stops on "inside" or on any refusal. */
  async function process(raw: string, camera: boolean) {
    setFromCamera(camera);
    // A QR carries the ticket's UUID; at the desk people type the short ticket
    // name the table shows as "Ticket ID", so that is looked up too.
    const byName = tickets.find(
      (tk) => tk.ticketName.toLowerCase() === raw.trim().toLowerCase(),
    );
    const id = extractTicketCode(raw) ?? byName?.ticketId ?? null;
    if (!id) {
      setView({
        kind: "error",
        title: ts("invalid_title"),
        message: ts("not_a_ticket"),
      });
      return;
    }
    const blocked = windowError();
    if (blocked) {
      setView(blocked);
      return;
    }
    setView({ kind: "working" });
    const scan = await ScanTicketAction(event.eventId, id, locale);
    if (scan.status !== "success") {
      setView({
        kind: "error",
        title: ts("invalid_title"),
        message: scan.message,
      });
      return;
    }
    if (scan.availableAction === "check_out") {
      setView({ kind: "inside", scan });
      return;
    }
    if (!scan.canCheckIn) {
      setView({
        kind: "error",
        title: ts("not_open_title"),
        message:
          scan.checkInWindow === "too_early"
            ? ts("too_early", { time: scan.opensAt ?? "" })
            : ts("closed"),
        ticket: scan.ticket,
      });
      return;
    }
    const result = await CheckInTicketAction(
      event.eventId,
      pathname,
      scan.ticket.ticketId,
      locale,
    );
    if (result.status === "success") {
      setView({
        kind: "done",
        checkedOut: false,
        ticket: result.ticket ?? scan.ticket,
        totalMinutesInside: scan.totalMinutesInside,
        entriesCount: scan.entriesCount + 1,
      });
      router.refresh();
    } else if (result.status === "already_checked") {
      setView({
        kind: "error",
        title: ts("already_title"),
        message: result.message,
        ticket: result.ticket ?? scan.ticket,
      });
    } else {
      setView({
        kind: "error",
        title: ts("error_title"),
        message: result.message,
      });
    }
  }

  async function checkOut() {
    if (view.kind !== "inside") return;
    const { scan } = view;
    setView({ kind: "working", checkingOut: true });
    const result = await CheckOutTicketAction(
      event.eventId,
      pathname,
      scan.ticket.ticketId,
      locale,
    );
    if (result.status === "success") {
      setView({
        kind: "done",
        checkedOut: true,
        ticket: scan.ticket,
        sessionMinutes: result.sessionMinutes,
        totalMinutesInside: result.totalMinutesInside,
        entriesCount: scan.entriesCount,
      });
      router.refresh();
    } else {
      setView({
        kind: "error",
        title: ts("error_title"),
        message: result.message,
      });
    }
  }

  /** Back to the start; straight into the camera when that is how we got here. */
  function next() {
    setTicketId("");
    if (fromCamera) startCamera();
    else setView({ kind: "idle" });
  }

  const showInputs = view.kind === "idle" || view.kind === "camera";

  return (
    <Drawer open={open} onOpenChange={openChange} direction="right">
      <ButtonPill className={triggerClassName} onClick={() => setOpen(true)}>
        <Scanner variant={"Bulk"} color={"#737C8A"} size={20} aria-hidden />
        {t("check_in_short")}
      </ButtonPill>
      <DrawerContent className="bg-white border-none outline-none my-6 mr-4 lg:mr-6 p-6 lg:p-10 rounded-[30px] data-[vaul-drawer-direction=right]:w-[calc(100vw-2rem)] data-[vaul-drawer-direction=right]:lg:w-[58rem]">
        <DrawerTitle className="font-primary font-medium text-center text-[2.2rem] leading-12 text-black pb-6 shrink-0">
          {ts("title")}
        </DrawerTitle>
        <DrawerDescription className="sr-only">
          {ts("id_description")}
        </DrawerDescription>

        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
          <AnimatePresence mode="wait" initial={false}>
            {showInputs ? (
              <motion.div
                key="inputs"
                className="flex flex-col gap-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease }}
              >
                <ScanBox
                  active={view.kind === "camera"}
                  onTap={startCamera}
                  label={ts("tap_to_scan")}
                >
                  {view.kind === "camera" && (
                    <TicketCamera
                      key={scannerKey}
                      onScan={(raw) => process(raw, true)}
                      messages={{
                        denied: ts("camera_denied"),
                        unavailable: ts("camera_unavailable"),
                        insecure: ts("camera_insecure"),
                        failed: ts("camera_failed"),
                        retry: ts("camera_retry"),
                      }}
                    />
                  )}
                </ScanBox>
                <p className="text-center font-sans text-[1.5rem] text-deep-100">
                  {ts("or")}
                </p>
                <form
                  className="flex items-center gap-4 rounded-[10rem] border border-primary-500 pl-6 pr-[.6rem] py-[.6rem] focus-within:shadow-[0_0_0_4px_rgba(228,91,0,0.08)]"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (ticketId.trim()) process(ticketId.trim(), false);
                  }}
                >
                  <label className="flex-1 min-w-0 flex flex-col">
                    <span className="font-sans text-[1.1rem] leading-6 text-neutral-500">
                      {ts("ticket_id_label")}
                    </span>
                    <input
                      value={ticketId}
                      onChange={(e) => setTicketId(e.target.value)}
                      placeholder={ts("ticket_id_placeholder")}
                      className="w-full bg-transparent outline-none font-sans text-[1.5rem] leading-8 text-deep-100 placeholder:text-neutral-400"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={!ticketId.trim()}
                    className="shrink-0 rounded-[10rem] border border-primary-500 bg-primary-50 px-[1.4rem] py-[.8rem] font-sans text-[1.4rem] leading-6 text-primary-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {ts("check_in")}
                  </button>
                </form>
              </motion.div>
            ) : view.kind === "working" ? (
              <motion.div
                key="working"
                className="flex-1 min-h-[30rem] flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p
                  aria-live="polite"
                  className="font-sans text-[1.6rem] text-primary-500 flex items-end"
                >
                  {view.checkingOut ? ts("checking_out") : ts("checking")}
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      aria-hidden
                      animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{
                        duration: 0.9,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                    >
                      .
                    </motion.span>
                  ))}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={view.kind}
                className="flex-1 min-h-[30rem] flex flex-col items-center justify-center gap-8 text-center px-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease }}
              >
                <ResultVisual
                  tone={
                    view.kind === "error"
                      ? "error"
                      : view.kind === "inside"
                        ? "info"
                        : "success"
                  }
                />
                <div className="flex flex-col gap-3 items-center">
                  <h3 className="font-primary font-medium text-[2.2rem] lg:text-[2.6rem] leading-[1.2] text-black">
                    {view.kind === "done"
                      ? view.checkedOut
                        ? ts("checkout_title")
                        : ts("success_title")
                      : view.kind === "inside"
                        ? ts("inside_title")
                        : view.title}
                  </h3>
                  <p className="font-sans text-[1.5rem] leading-8 text-neutral-600 max-w-[34rem]">
                    {view.kind === "done"
                      ? view.checkedOut
                        ? ts("checkout_body", {
                            name: view.ticket?.fullName ?? "",
                          })
                        : ts("success_body")
                      : view.kind === "inside"
                        ? ts("inside_body", { name: view.scan.ticket.fullName })
                        : view.message}
                  </p>
                </div>
                {(view.kind === "done" ||
                  view.kind === "inside" ||
                  (view.kind === "error" && view.ticket)) && (
                  <TicketCard
                    ticket={
                      view.kind === "inside" ? view.scan.ticket : view.ticket!
                    }
                    stats={
                      view.kind === "inside"
                        ? [
                            {
                              label: ts("time_inside"),
                              value: formatDuration(
                                view.scan.totalMinutesInside,
                              ),
                            },
                            {
                              label: ts("entries"),
                              value: String(view.scan.entriesCount),
                            },
                          ]
                        : view.kind === "done"
                          ? [
                              view.checkedOut
                                ? {
                                    label: ts("stayed"),
                                    value: formatDuration(
                                      view.sessionMinutes ?? 0,
                                    ),
                                  }
                                : {
                                    label: ts("time_inside"),
                                    value: formatDuration(
                                      view.totalMinutesInside ?? 0,
                                    ),
                                  },
                              {
                                label: ts("entries"),
                                value: String(view.entriesCount ?? 0),
                              },
                            ]
                          : []
                    }
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer (Figma: Close + Add check-in device; the device button is
            left out for now). */}
        <div className="flex gap-4 pt-6 shrink-0">
          {showInputs ? (
            <button
              type="button"
              className={secondaryFooter}
              onClick={() => openChange(false)}
            >
              {ts("close")}
            </button>
          ) : view.kind === "inside" ? (
            <>
              <button type="button" className={secondaryFooter} onClick={next}>
                {ts("cancel")}
              </button>
              <button
                type="button"
                className={primaryFooter}
                onClick={checkOut}
              >
                {ts("check_out")}
              </button>
            </>
          ) : view.kind === "done" ? (
            <button type="button" className={secondaryFooter} onClick={next}>
              {ts("continue")}
            </button>
          ) : view.kind === "error" ? (
            <button type="button" className={secondaryFooter} onClick={next}>
              {ts("retry")}
            </button>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/** Figma's grey square with the four black corner marks. */
function ScanBox({
  active,
  onTap,
  label,
  children,
}: {
  active: boolean;
  onTap: () => void;
  label: string;
  children?: React.ReactNode;
}) {
  const corner = "absolute w-[4.2rem] h-[4.2rem] border-black border-[.4rem]";
  return (
    <div className="relative w-full aspect-square lg:aspect-auto lg:h-[min(45rem,calc(100dvh-30rem))] lg:min-h-[18rem] rounded-[2rem] bg-neutral-100 overflow-hidden">
      {active ? (
        <div className="absolute inset-0 flex items-center justify-center [&>*]:w-full">
          {children}
        </div>
      ) : (
        <button
          type="button"
          onClick={onTap}
          className="absolute inset-0 flex items-center justify-center cursor-pointer font-sans text-[1.6rem] text-primary-500 group"
        >
          <motion.span
            animate={{ opacity: [1, 0.55, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {label}
          </motion.span>
        </button>
      )}
      {/* The corner marks sit over the camera feed too. */}
      <div className="pointer-events-none absolute inset-[18%_16%]">
        <span
          className={cn(
            corner,
            "top-0 left-0 border-r-0 border-b-0 rounded-tl-[1.2rem]",
          )}
        />
        <span
          className={cn(
            corner,
            "top-0 right-0 border-l-0 border-b-0 rounded-tr-[1.2rem]",
          )}
        />
        <span
          className={cn(
            corner,
            "bottom-0 left-0 border-r-0 border-t-0 rounded-bl-[1.2rem]",
          )}
        />
        <span
          className={cn(
            corner,
            "bottom-0 right-0 border-l-0 border-t-0 rounded-br-[1.2rem]",
          )}
        />
      </div>
    </div>
  );
}

function ResultVisual({ tone }: { tone: "success" | "error" | "info" }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 16 }}
    >
      {tone === "success" ? (
        <Image src={SuccessBadge} alt="" width={96} height={96} priority />
      ) : (
        <span
          className={cn(
            "w-[6.4rem] h-[6.4rem] rounded-[1.4rem] flex items-center justify-center font-primary font-bold text-[3.6rem] text-white shadow-[inset_0_-6px_0_rgba(0,0,0,0.15),0_10px_20px_rgba(0,0,0,0.12)]",
            tone === "error"
              ? "bg-linear-to-b from-[#F06464] to-[#D93636]"
              : "bg-linear-to-b from-[#F5A524] to-[#E07B00]",
          )}
          aria-hidden
        >
          !
        </span>
      )}
    </motion.div>
  );
}

function TicketCard({
  ticket,
  stats,
}: {
  ticket: TicketInfo;
  stats: { label: string; value: string }[];
}) {
  return (
    <div className="w-full max-w-[38rem] rounded-[1.5rem] border border-neutral-100 bg-neutral-50 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 text-left">
        <div className="min-w-0">
          <p className="font-sans font-semibold text-[1.6rem] leading-8 text-deep-100 truncate">
            {ticket.fullName}
          </p>
          <p className="font-sans text-[1.3rem] leading-7 text-neutral-500">
            {ticket.ticketName}
          </p>
        </div>
        <span className="shrink-0 uppercase text-[1.1rem] font-bold px-3 py-1 rounded-full bg-white border border-neutral-200 text-[#EF1870]">
          {ticket.ticketType}
        </span>
      </div>
      {stats.length > 0 && (
        <div className="flex border-t border-neutral-100 pt-4">
          {stats.map((s) => (
            <div key={s.label} className="flex-1 flex flex-col items-center">
              <span className="text-[1.1rem] uppercase font-bold text-neutral-500">
                {s.label}
              </span>
              <span className="text-[1.6rem] font-semibold text-deep-100">
                {s.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
