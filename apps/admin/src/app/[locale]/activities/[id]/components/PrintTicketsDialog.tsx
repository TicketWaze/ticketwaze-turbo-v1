"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { DocumentDownload, Printer } from "iconsax-reactjs";
import { Event } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { ButtonBlack, ButtonNeutral } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { cn } from "@/lib/utils";

type Mode = "physical" | "sold";

type Batch = {
  batchId: string;
  ticketType: string;
  quantity: number;
  checked: number;
  /** Cancelled: refused at the door, left out of a reprint. */
  void: number;
  createdAt: string;
};

/** Mirrors MAX_PHYSICAL_BATCH in the API's services/physical_tickets. */
const MAX_BATCH = 500;

/**
 * PRINT TICKETS — Letter sheets, four horizontal tickets each, as a PDF.
 *
 * Two jobs, one per tab:
 * - "To sell by hand": a new print run of physical tickets. A SIDE STOCK — it
 *   takes nothing from the online ticket quantities and is not a sale on the
 *   platform; the organisation sees it as a record. The tickets scan at the
 *   door like any other.
 * - "Sold tickets": what buyers already hold, with their names, for a guest
 *   list or someone without a phone. Nothing is created.
 *
 * The API renders the PDF (the same card as the emailed ticket, laid out for
 * paper); this only asks for it and hands the file over.
 */
export default function PrintTicketsDialog({
  event,
  open,
  onOpenChange,
}: {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const locale = useLocale();
  const { data: session } = useSession();
  const token = session?.user.accessToken ?? "";

  const ticketTypes = event.eventTicketTypes ?? [];
  const [mode, setMode] = useState<Mode>("physical");
  const [ticketTypeId, setTicketTypeId] = useState(
    ticketTypes[0]?.eventTicketTypeId ?? "",
  );
  const [quantity, setQuantity] = useState("100");
  // "" = every ticket type.
  const [soldType, setSoldType] = useState("");
  const [batches, setBatches] = useState<Batch[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const api = `${process.env.NEXT_PUBLIC_API_URL}/admin/event/${event.eventId}/print`;

  const loadBatches = useCallback(async () => {
    try {
      const res = await fetch(`${api}/batches`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Language": locale,
        },
      });
      const data = await res.json();
      setBatches(data.status === "success" ? data.batches : []);
    } catch {
      setBatches([]);
    }
  }, [api, token, locale]);

  useEffect(() => {
    if (open && token) loadBatches();
  }, [open, token, loadBatches]);

  /**
   * Fetch a PDF and save it. The API answers JSON when it refuses, so a
   * non-PDF response is read for its message instead of saved as a file.
   */
  async function download(url: string, filename: string) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, "Accept-Language": locale },
    });
    if (!res.ok || !res.headers.get("content-type")?.includes("pdf")) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? "The PDF could not be generated.");
    }
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
  }

  const slug = event.eventName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const qty = Number(quantity);
  const qtyValid = Number.isInteger(qty) && qty >= 1 && qty <= MAX_BATCH;

  async function createBatch() {
    if (!qtyValid || !ticketTypeId || busy) return;
    setBusy("create");
    try {
      const res = await fetch(`${api}/batches`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Language": locale,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventTicketTypeId: ticketTypeId,
          quantity: qty,
        }),
      });
      const data = await res.json();
      if (data.status !== "success") throw new Error(data.message);
      await download(
        `${api}/batches/${data.batchId}`,
        `${slug}-printed-tickets.pdf`,
      );
      toast.success(`${data.quantity} printed tickets created.`);
      loadBatches();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  }

  /** The run whose "Cancel" was clicked and awaits a second, explicit click. */
  const [confirmVoid, setConfirmVoid] = useState<string | null>(null);

  /**
   * Cancel what is left of a run: every ticket not yet scanned. Asked twice,
   * inline, because it cannot be undone — a cancelled ticket may already be in
   * a buyer's hand, and the door will now turn it away.
   */
  async function voidBatch(batch: Batch) {
    if (busy) return;
    setBusy(`void-${batch.batchId}`);
    try {
      const res = await fetch(`${api}/batches/${batch.batchId}/void`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Language": locale,
        },
      });
      const data = await res.json();
      if (data.status !== "success") throw new Error(data.message);
      toast.success(`${data.voided} printed ticket(s) cancelled.`);
      setConfirmVoid(null);
      loadBatches();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  }

  async function reprint(batch: Batch) {
    if (busy) return;
    setBusy(batch.batchId);
    try {
      await download(
        `${api}/batches/${batch.batchId}`,
        `${slug}-printed-tickets.pdf`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  }

  async function printSold() {
    if (busy) return;
    setBusy("sold");
    try {
      const query = soldType
        ? `?ticketType=${encodeURIComponent(soldType)}`
        : "";
      await download(`${api}/sold${query}`, `${slug}-sold-tickets.pdf`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  }

  const currency = event.currency === "USD" ? "USD" : "HTG";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <DialogTitle>Print tickets</DialogTitle>
            <DialogDescription className="text-[1.3rem] leading-6 text-neutral-500">
              {event.eventName} · Letter (8.5&quot; × 11&quot;), 4 tickets per
              sheet
            </DialogDescription>
          </div>

          <div className="flex w-full bg-neutral-100 rounded-full p-1">
            {(
              [
                ["physical", "To sell by hand"],
                ["sold", "Sold tickets"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={cn(
                  "flex-1 py-[8px] rounded-full text-[1.4rem] font-medium transition-colors cursor-pointer",
                  mode === value
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-500",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "physical" ? (
            <>
              <p className="text-[1.3rem] leading-6 text-neutral-600">
                Creates new tickets with their own QR codes, valid at the door.
                They are a separate stock: online ticket quantities and sales
                are not affected. The organisation sees them in its records.
              </p>

              <div className="flex flex-col gap-3">
                <label className="text-[1.4rem] font-medium text-black">
                  Ticket type
                </label>
                <div className="flex flex-col gap-2">
                  {ticketTypes.map((tier) => {
                    const active = tier.eventTicketTypeId === ticketTypeId;
                    return (
                      <button
                        key={tier.eventTicketTypeId}
                        type="button"
                        onClick={() => setTicketTypeId(tier.eventTicketTypeId)}
                        className={cn(
                          "flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-colors cursor-pointer",
                          active
                            ? "border-black bg-neutral-100"
                            : "border-neutral-200 hover:border-neutral-400",
                        )}
                      >
                        <span className="text-[1.4rem] font-medium text-black">
                          {tier.ticketTypeName}
                        </span>
                        <span className="text-[1.35rem] font-medium text-deep-100">
                          {formatMoney(
                            currency === "USD"
                              ? tier.usdPrice
                              : tier.ticketTypePrice,
                            currency,
                            locale,
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label
                  htmlFor="print-quantity"
                  className="text-[1.4rem] font-medium text-black"
                >
                  How many
                </label>
                <input
                  id="print-quantity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_BATCH}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="bg-neutral-100 rounded-[30px] px-6 py-4 text-[1.4rem] outline-none"
                />
                <span className="text-[1.2rem] text-neutral-500">
                  {qtyValid
                    ? `${Math.ceil(qty / 4)} sheet(s) to print.`
                    : `Between 1 and ${MAX_BATCH} per run.`}
                </span>
              </div>

              {batches && batches.length > 0 && (
                <div className="flex flex-col gap-3">
                  <span className="text-[1.4rem] font-medium text-black">
                    Previous runs
                  </span>
                  <ul className="flex flex-col divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
                    {batches.map((batch) => {
                      // Still valid and not yet used: what a cancel would void.
                      const unscanned =
                        batch.quantity - batch.checked - batch.void;
                      const printable = batch.quantity - batch.void;
                      return (
                        <li
                          key={batch.batchId}
                          className="flex flex-col gap-3 px-5 py-3"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex flex-col">
                              <span className="text-[1.4rem] font-medium text-black">
                                {batch.quantity} × {batch.ticketType}
                              </span>
                              <span className="text-[1.2rem] text-neutral-500">
                                {new Date(batch.createdAt).toLocaleString(
                                  locale,
                                  { dateStyle: "medium", timeStyle: "short" },
                                )}{" "}
                                · {batch.checked} scanned
                                {batch.void > 0 && (
                                  <span className="text-failure">
                                    {" "}
                                    · {batch.void} cancelled
                                  </span>
                                )}
                              </span>
                            </span>
                            <div className="flex items-center gap-5 shrink-0">
                              {printable > 0 && (
                                <button
                                  type="button"
                                  onClick={() => reprint(batch)}
                                  disabled={busy !== null}
                                  className="flex items-center gap-2 text-[1.3rem] font-medium text-primary-500 cursor-pointer disabled:opacity-50"
                                >
                                  {busy === batch.batchId ? (
                                    <LoadingCircleSmall />
                                  ) : (
                                    <DocumentDownload
                                      size="18"
                                      color="#E45B00"
                                      variant="Bulk"
                                    />
                                  )}
                                  PDF
                                </button>
                              )}
                              {unscanned > 0 &&
                                confirmVoid !== batch.batchId && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConfirmVoid(batch.batchId)
                                    }
                                    disabled={busy !== null}
                                    className="text-[1.3rem] font-medium text-failure cursor-pointer disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                )}
                            </div>
                          </div>
                          {confirmVoid === batch.batchId && (
                            <div className="flex flex-col gap-3 rounded-[15px] border border-[#E53935]/30 bg-[#FDECEA] p-4">
                              <span className="text-[1.3rem] leading-6 text-[#B3261E]">
                                Cancel the {unscanned} unscanned ticket(s) of
                                this run? They will be refused at the door.
                                Tickets already scanned stay on record. This
                                cannot be undone.
                              </span>
                              <div className="flex gap-3">
                                <ButtonNeutral
                                  className="flex-1 py-3"
                                  onClick={() => setConfirmVoid(null)}
                                  disabled={busy !== null}
                                >
                                  Keep them
                                </ButtonNeutral>
                                <button
                                  type="button"
                                  onClick={() => voidBatch(batch)}
                                  disabled={busy !== null}
                                  className="flex-1 rounded-[100px] bg-[#DE0028] py-3 text-[1.4rem] font-medium text-white cursor-pointer disabled:opacity-50 flex items-center justify-center"
                                >
                                  {busy === `void-${batch.batchId}` ? (
                                    <LoadingCircleSmall />
                                  ) : (
                                    `Cancel ${unscanned}`
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-[1.3rem] leading-6 text-neutral-600">
                Prints the tickets buyers already hold, each with the
                holder&apos;s name and the same QR code as their online ticket.
                Nothing new is created.
              </p>
              <div className="flex flex-col gap-3">
                <label className="text-[1.4rem] font-medium text-black">
                  Ticket type
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "", label: "All" },
                    ...ticketTypes.map((tier) => ({
                      value: tier.ticketTypeName,
                      label: tier.ticketTypeName,
                    })),
                  ].map((option) => (
                    <button
                      key={option.value || "all"}
                      type="button"
                      onClick={() => setSoldType(option.value)}
                      className={cn(
                        "rounded-full border-2 px-5 py-2 text-[1.35rem] font-medium cursor-pointer transition-colors",
                        soldType === option.value
                          ? "border-black bg-neutral-100 text-black"
                          : "border-neutral-200 text-neutral-600 hover:border-neutral-400",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <ButtonNeutral
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Close
            </ButtonNeutral>
            {mode === "physical" ? (
              <ButtonBlack
                className="flex-1 gap-3"
                disabled={busy !== null || !qtyValid || !ticketTypeId}
                onClick={createBatch}
              >
                {busy === "create" ? (
                  <LoadingCircleSmall />
                ) : (
                  <>
                    <Printer size="18" color="#ffffff" variant="Bulk" />
                    {qtyValid
                      ? `Create ${qty} & download PDF`
                      : "Create & download PDF"}
                  </>
                )}
              </ButtonBlack>
            ) : (
              <ButtonBlack
                className="flex-1 gap-3"
                disabled={busy !== null}
                onClick={printSold}
              >
                {busy === "sold" ? (
                  <LoadingCircleSmall />
                ) : (
                  <>
                    <DocumentDownload
                      size="18"
                      color="#ffffff"
                      variant="Bulk"
                    />
                    Download PDF
                  </>
                )}
              </ButtonBlack>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
