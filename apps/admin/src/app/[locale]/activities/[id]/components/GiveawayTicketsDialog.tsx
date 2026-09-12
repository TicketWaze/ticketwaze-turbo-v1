"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { CloseCircle, Gift, TickCircle, Warning2 } from "iconsax-reactjs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ButtonBlack, ButtonNeutral } from "@/components/shared/buttons";
import SearchInput from "@/components/shared/SearchInput";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  GiveawayTicketsAction,
  SearchGiveawayRecipientsAction,
  type GiveawayRecipient,
} from "@/actions/Activity";
import { Event, EventTicketType } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import { cn } from "@/lib/utils";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;

/** What one seat of this tier costs Ticketwaze, in the event's own currency. */
function tierPrice(event: Event, tier: EventTicketType): number {
  return event.currency === "USD"
    ? Number(tier.usdPrice)
    : Number(tier.ticketTypePrice);
}

function seatsLeft(tier: EventTicketType): number {
  return Number(tier.ticketTypeQuantity) - Number(tier.ticketTypeQuantitySold);
}

/**
 * Why the giveaway is unavailable, or null when it is offered.
 *
 * Mirrors the API's guards in services/ticket_giveaway.ts — the API decides,
 * this only explains the answer without a round trip. Deliberately does NOT
 * check the organiser's `ticketSalesEndAt`: an admin may still comp a seat
 * after the organiser has stopped selling, and the API allows it.
 */
function giveawayBlockedReason(event: Event): string | null {
  if (event.cancelledAt) return "This event has been cancelled.";
  if (event.isComingSoon) return "A teaser has no tickets to give away yet.";
  if (event.adminStatus !== "approved")
    return "This event has not been approved yet.";
  if ((event.eventTicketTypes ?? []).length === 0)
    return "This event has no ticket types.";
  return null;
}

/**
 * Hand free tickets to Ticketwaze account holders.
 *
 * One tier per giveaway and one ticket per recipient, both by design rather
 * than by omission: a giveaway that mixed tiers would have no single cost to
 * show, and a quantity per person is a different feature with a different
 * conversation about inventory.
 *
 * TICKETWAZE PAYS. The organisation is credited the tier's face value in both
 * currencies, so the cost is shown before the button rather than discovered in
 * the ledger afterwards — it is the part of this decision that spends money.
 *
 * Recipients must hold an account: the search only returns accounts, so there
 * is no path here to gift a bare email address. Someone who already holds a
 * ticket can still receive one, and is flagged rather than hidden so a second
 * ticket is deliberate.
 */
export default function GiveawayTicketsDialog({
  event,
  className,
  open: openProp,
  onOpenChange,
  hideTrigger,
}: {
  event: Event;
  className?: string;
  /** See the note on EventStatusDialog — the menu renders this as a sibling. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;

  /** Writes to whichever owns the state — the parent when it passed `open`. */
  function setOpenState(next: boolean) {
    setInternalOpen(next);
    onOpenChange?.(next);
  }
  const [query, setQuery] = useState("");
  /**
   * The last search that came back, tagged with the term it answers.
   *
   * Keyed by term rather than held as a bare list so "are we still searching?"
   * and "do these results belong to what is typed?" are both DERIVED below
   * instead of being extra state an effect has to keep in step — which is how
   * a stale list ends up shown under a newer query.
   */
  const [loaded, setLoaded] = useState<{
    term: string;
    users: GiveawayRecipient[];
  }>({ term: "", users: [] });
  const [selected, setSelected] = useState<GiveawayRecipient[]>([]);
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const ticketTypes = event.eventTicketTypes ?? [];
  const [ticketTypeId, setTicketTypeId] = useState(
    ticketTypes.length === 1 ? ticketTypes[0]!.eventTicketTypeId : "",
  );

  const { data: session } = useSession();
  const locale = useLocale();
  const disabledReason = giveawayBlockedReason(event);

  const ticketType = ticketTypes.find(
    (tier) => tier.eventTicketTypeId === ticketTypeId,
  );
  const available = ticketType ? seatsLeft(ticketType) : 0;
  const unitPrice = ticketType ? tierPrice(event, ticketType) : 0;
  const totalCost = unitPrice * selected.length;
  const overCapacity = ticketType !== undefined && selected.length > available;

  const term = query.trim();
  const isSearchable = term.length >= MIN_SEARCH_LENGTH;
  // Derived, not stored: results are only ever shown for the term they answer,
  // and anything else counts as still searching.
  const results = loaded.term === term ? loaded.users : [];
  const isSearching = isSearchable && loaded.term !== term;

  /**
   * Debounced so a typed name is one request rather than one per keystroke.
   * The in-flight request is stamped and its result dropped when a newer query
   * has been typed since — otherwise a slow early response lands on top of a
   * fast later one and the list shows matches for text already replaced.
   */
  const requestId = useRef(0);
  useEffect(() => {
    if (!isSearchable) return;

    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      const found = await SearchGiveawayRecipientsAction(
        event.eventId,
        term,
        session?.user.accessToken ?? "",
        locale,
      );
      if (id !== requestId.current) return;
      setLoaded({ term, users: found });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [term, isSearchable, event.eventId, session?.user.accessToken, locale]);

  const selectedIds = useMemo(
    () => new Set(selected.map((user) => user.userId)),
    [selected],
  );

  function handleOpenChange(next: boolean) {
    setOpenState(next);
    if (!next) {
      setQuery("");
      setLoaded({ term: "", users: [] });
      setSelected([]);
      setNote("");
      setTicketTypeId(
        ticketTypes.length === 1 ? ticketTypes[0]!.eventTicketTypeId : "",
      );
    }
  }

  function toggleRecipient(user: GiveawayRecipient) {
    setSelected((current) =>
      current.some((picked) => picked.userId === user.userId)
        ? current.filter((picked) => picked.userId !== user.userId)
        : [...current, user],
    );
  }

  async function handleConfirm() {
    if (!ticketType) return;
    setIsLoading(true);
    const result = await GiveawayTicketsAction(
      event.eventId,
      ticketType.eventTicketTypeId,
      selected.map((user) => user.userId),
      note,
      session?.user.accessToken ?? "",
      locale,
    );
    setIsLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    // The credited amount is reported rather than swallowed: it is what
    // Ticketwaze just spent, and the organiser's balance now shows it.
    toast.success(
      `Gave ${result.ticketsIssued} ${result.ticketTypeName} ticket(s). Organiser credited ${formatMoney(
        result.creditedHtg,
        "HTG",
        locale,
      )} / ${formatMoney(result.creditedUsd, "USD", locale)}.`,
      { duration: 10000 },
    );
    handleOpenChange(false);
  }

  if (disabledReason) {
    return (
      <ButtonNeutral
        disabled
        title={disabledReason}
        className={cn("py-[7.5px] opacity-50 cursor-not-allowed", className)}
      >
        Giveaway
      </ButtonNeutral>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <ButtonBlack className={cn("py-[7.5px] gap-3", className)}>
            <Gift size="18" color="#ffffff" variant="Bulk" />
            Giveaway
          </ButtonBlack>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <DialogTitle>Give away tickets</DialogTitle>
            <p className="text-[1.3rem] leading-6 text-neutral-500">
              {event.eventName}
            </p>
          </div>

          {/* Ticket type — one per giveaway. */}
          {ticketTypes.length > 1 ? (
            <div className="flex flex-col gap-3">
              <label className="text-[1.4rem] font-medium text-black">
                Ticket type <span className="text-[#E53935]">*</span>
              </label>
              <div className="flex flex-col gap-2">
                {ticketTypes.map((tier) => {
                  const left = seatsLeft(tier);
                  const isActive = tier.eventTicketTypeId === ticketTypeId;
                  return (
                    <button
                      key={tier.eventTicketTypeId}
                      type="button"
                      disabled={left <= 0}
                      onClick={() => setTicketTypeId(tier.eventTicketTypeId)}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-colors",
                        left <= 0
                          ? "border-neutral-200 opacity-50 cursor-not-allowed"
                          : "cursor-pointer",
                        isActive
                          ? "border-black bg-neutral-100"
                          : "border-neutral-200 hover:border-neutral-400",
                      )}
                    >
                      <span className="flex flex-col">
                        <span className="text-[1.4rem] font-medium text-black">
                          {tier.ticketTypeName}
                        </span>
                        <span className="text-[1.25rem] text-neutral-500">
                          {left <= 0 ? "Sold out" : `${left} left`}
                        </span>
                      </span>
                      <span className="text-[1.35rem] font-medium text-deep-100">
                        {formatMoney(
                          tierPrice(event, tier),
                          event.currency === "USD" ? "USD" : "HTG",
                          locale,
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            ticketType && (
              <div className="flex items-center justify-between rounded-2xl bg-neutral-100 px-5 py-4">
                <span className="flex flex-col">
                  <span className="text-[1.4rem] font-medium text-black">
                    {ticketType.ticketTypeName}
                  </span>
                  <span className="text-[1.25rem] text-neutral-500">
                    {available} left
                  </span>
                </span>
                <span className="text-[1.35rem] font-medium text-deep-100">
                  {formatMoney(
                    unitPrice,
                    event.currency === "USD" ? "USD" : "HTG",
                    locale,
                  )}
                </span>
              </div>
            )
          )}

          {/* Recipients. */}
          <div className="flex flex-col gap-3">
            <label className="text-[1.4rem] font-medium text-black">
              Recipients <span className="text-[#E53935]">*</span>
            </label>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search by name or email"
              className="w-full lg:w-full"
            />

            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selected.map((user) => (
                  <span
                    key={user.userId}
                    className="flex items-center gap-2 rounded-[3rem] bg-black px-4 py-2 text-[1.25rem] text-white"
                  >
                    {`${user.firstName} ${user.lastName}`.trim()}
                    <button
                      type="button"
                      onClick={() => toggleRecipient(user)}
                      aria-label={`Remove ${user.email}`}
                      className="cursor-pointer flex items-center"
                    >
                      <CloseCircle size="16" color="#ffffff" variant="Bulk" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {isSearchable && (
              <div className="max-h-[22rem] overflow-y-auto rounded-2xl border-2 border-neutral-200">
                {isSearching ? (
                  <div className="flex justify-center py-6">
                    <LoadingCircleSmall />
                  </div>
                ) : results.length === 0 ? (
                  <p className="px-5 py-6 text-[1.3rem] text-neutral-500">
                    No Ticketwaze account matches that. Only account holders can
                    receive a giveaway.
                  </p>
                ) : (
                  <ul className="flex flex-col">
                    {results.map((user) => {
                      const isPicked = selectedIds.has(user.userId);
                      return (
                        <li key={user.userId}>
                          <button
                            type="button"
                            onClick={() => toggleRecipient(user)}
                            className={cn(
                              "flex w-full items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer transition-colors",
                              isPicked
                                ? "bg-neutral-100"
                                : "hover:bg-neutral-50",
                            )}
                          >
                            <span className="flex flex-col min-w-0">
                              <span className="text-[1.35rem] text-black truncate">
                                {`${user.firstName} ${user.lastName}`.trim()}
                              </span>
                              <span className="text-[1.25rem] text-neutral-500 truncate">
                                {user.email}
                              </span>
                            </span>
                            <span className="flex items-center gap-3 shrink-0">
                              {user.holdsTicket && (
                                <span className="rounded-[3rem] bg-neutral-100 px-3 py-1 text-[1.1rem] text-neutral-600">
                                  Has a ticket
                                </span>
                              )}
                              {isPicked && (
                                <TickCircle
                                  size="20"
                                  color="#000000"
                                  variant="Bulk"
                                />
                              )}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Optional note — recorded on the balance ledger, never emailed. */}
          <div className="flex flex-col gap-2">
            <label className="text-[1.4rem] font-medium text-black">
              Note <span className="text-neutral-400">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why these tickets are being given away. Recorded on the organiser's balance ledger."
              rows={2}
              maxLength={500}
              className="w-full resize-none rounded-2xl border-2 border-neutral-200 px-4 py-3 text-[1.4rem] leading-7 text-black placeholder:text-neutral-400 focus:border-black focus:outline-none transition-colors"
            />
          </div>

          {/* What this costs. */}
          {selected.length > 0 && ticketType && (
            <div className="flex flex-col gap-3 rounded-[15px] border border-neutral-200 bg-neutral-100 p-5">
              <div className="flex items-center justify-between">
                <span className="text-[1.35rem] text-neutral-700">
                  {selected.length} × {ticketType.ticketTypeName}
                </span>
                <span className="text-[1.5rem] font-medium text-deep-100">
                  {formatMoney(
                    totalCost,
                    event.currency === "USD" ? "USD" : "HTG",
                    locale,
                  )}
                </span>
              </div>
              <p className="text-[1.25rem] leading-6 text-neutral-600">
                Ticketwaze covers this. The organiser&apos;s pending balance is
                credited the same amount in both HTG and USD, and these seats
                come out of the ticket type&apos;s inventory.
              </p>
            </div>
          )}

          {overCapacity && (
            <div className="flex items-center gap-3 rounded-[15px] border border-[#E53935]/30 bg-[#FDECEA] p-4">
              <Warning2 size="20" color="#B3261E" variant="Bulk" />
              <span className="text-[1.3rem] leading-6 text-[#B3261E]">
                Only {available} {ticketType?.ticketTypeName} ticket(s) left —
                remove {selected.length - available} recipient(s).
              </span>
            </div>
          )}

          <DialogFooter>
            <ButtonNeutral
              className="flex-1"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </ButtonNeutral>
            <ButtonBlack
              className="flex-1"
              disabled={
                isLoading ||
                !ticketType ||
                selected.length === 0 ||
                overCapacity
              }
              onClick={handleConfirm}
            >
              {isLoading ? (
                <LoadingCircleSmall />
              ) : selected.length === 0 ? (
                "Give tickets"
              ) : (
                `Give ${selected.length} ticket(s)`
              )}
            </ButtonBlack>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
