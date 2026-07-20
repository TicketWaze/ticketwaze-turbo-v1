"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Add, ArrowLeft2, Card, Minus, MoneyRecive } from "iconsax-reactjs";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { Restaurant } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import { useRouter } from "@/i18n/navigation";
import {
  GetAvailability,
  HoldReservation,
  PayReservationWallet,
  StartReservationStripe,
  StartReservationMoncash,
  type Slot,
} from "@/actions/reservationActions";
import { ButtonPrimary } from "@/components/shared/buttons";
import BackButton from "@/components/shared/BackButton";
import PageLoader from "@/components/PageLoader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import Calendar, { toDateKey } from "./Calendar";
import moncashLogo from "../../../[slug]/checkout/moncash.svg";

const inputClass =
  "bg-neutral-100 w-full rounded-[1.5rem] p-6 text-[1.5rem] leading-8 placeholder:text-neutral-600 text-deep-200 outline-none border border-transparent focus:border-primary-500";

/** How far ahead a table can be booked. */
const BOOKING_WINDOW_DAYS = 60;

/**
 * Mirrors app/controllers/utils/restaurant_pricing.ts so the total shown is the
 * total charged. Restaurants are PERCENTAGE-ONLY — no flat per-item fee.
 */
const SERVICE_FEE_RATE = 0.03;
const STRIPE_TX_FEE_RATE = 0.03;
const MONCASH_TX_FEE_RATE = 0.025;
const round2 = (n: number) => Math.round(n * 100) / 100;

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

type Method = "" | "wallet" | "card" | "moncash";

/**
 * Booking is a three-step checkout, deliberately shaped like the event one:
 * pick a time, give your details and how you will pay, then confirm.
 *
 * The seat is NOT held until the final step. Holding at step one would start a
 * countdown while someone is still typing their phone number, and an expired
 * hold discovered at the summary is a worse failure than a slot that filled up
 * while they browsed. So the last action holds and pays in one go.
 */
export default function ReserveForm({
  restaurant,
  slug,
  isLoggedIn,
  accessToken,
  defaultName,
  defaultEmail,
  walletHtg,
  walletUsd,
  feeWaived,
}: {
  restaurant: Restaurant;
  slug: string;
  isLoggedIn: boolean;
  accessToken: string;
  defaultName: string;
  defaultEmail: string;
  walletHtg: number;
  walletUsd: number;
  feeWaived: boolean;
}) {
  const t = useTranslations("Event.reserve");
  const ct = useTranslations("Checkout");
  const locale = useLocale();
  const router = useRouter();

  const [step, setStep] = useState(0);

  /**
   * Open on the next day the venue actually trades. Landing on a closed Monday
   * and showing "no tables" reads as broken, when they are simply shut.
   */
  const [date, setDate] = useState(() => {
    const open = restaurant.alwaysOpen
      ? new Set([0, 1, 2, 3, 4, 5, 6])
      : new Set((restaurant.hours ?? []).map((hour) => hour.dayOfWeek));

    const cursor = new Date();
    for (let i = 0; i <= BOOKING_WINDOW_DAYS; i++) {
      if (open.size === 0 || open.has(cursor.getDay())) return toDateKey(cursor);
      cursor.setDate(cursor.getDate() + 1);
    }
    return toDateKey(new Date());
  });

  /**
   * The venue's seat pool per slot is the hard ceiling on a party — asking for
   * more than it can ever fit strikes out every time and reads as broken. A
   * venue with a pool of 1 gets a stepper that starts and stops at 1.
   */
  const maxParty = restaurant.maxCoversPerSlot > 0
    ? Math.min(50, restaurant.maxCoversPerSlot)
    : 50;

  const [partySize, setPartySize] = useState(() => Math.min(2, maxParty));
  const [slot, setSlot] = useState<string | null>(null);
  const [month, setMonth] = useState(() => {
    const initial = new Date(`${date}T00:00:00`);
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });

  const [slots, setSlots] = useState<Slot[]>([]);
  const [htgFee, setHtgFee] = useState(0);
  const [usdFee, setUsdFee] = useState(0);
  const [currency, setCurrency] = useState("HTG");
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [method, setMethod] = useState<Method>("");

  const [busy, setBusy] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(
    null,
  );
  const [stripeOpen, setStripeOpen] = useState(false);

  const openDays = useMemo(() => {
    if (restaurant.alwaysOpen) return new Set([0, 1, 2, 3, 4, 5, 6]);
    return new Set((restaurant.hours ?? []).map((hour) => hour.dayOfWeek));
  }, [restaurant.alwaysOpen, restaurant.hours]);

  const maxDate = useMemo(() => {
    const last = new Date();
    last.setDate(last.getDate() + BOOKING_WINDOW_DAYS);
    return toDateKey(last);
  }, []);

  function changeDate(value: string) {
    setDate(value);
    setSlot(null);
    setLoadingSlots(true);
  }

  function changeParty(next: number) {
    setPartySize(next);
    setSlot(null);
    setLoadingSlots(true);
  }

  useEffect(() => {
    // Guards against a slower earlier request landing after a newer one and
    // showing availability for a party size the guest already moved off.
    let cancelled = false;

    (async () => {
      const result = await GetAvailability(slug, date, partySize, locale);
      if (cancelled) return;

      if (result.status === "success") {
        setSlots(result.slots);
        setHtgFee(result.htgFee);
        setUsdFee(result.usdFee);
        setCurrency(result.currency);
      } else {
        setSlots([]);
      }
      setLoadingSlots(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, date, partySize, locale, reloadToken]);

  const isCard = method === "card";
  const isMoncash = method === "moncash";
  const displayCurrency = isCard ? "USD" : isMoncash ? "HTG" : currency;

  const pricing = useMemo(() => {
    const base = currency === "USD" ? usdFee : htgFee;
    return {
      base,
      walletTotal: feeWaived ? base : round2(base * (1 + SERVICE_FEE_RATE)),
      // The server checks the USD side of the wallet regardless of the venue's
      // currency, so this must too — otherwise the button enables on a healthy
      // HTG balance and the request comes back 400.
      walletTotalUsd: feeWaived
        ? usdFee
        : round2(usdFee * (1 + SERVICE_FEE_RATE)),
      stripeUsd: feeWaived
        ? usdFee
        : round2(usdFee * (1 + SERVICE_FEE_RATE) * (1 + STRIPE_TX_FEE_RATE)),
      moncashHtg: feeWaived
        ? htgFee
        : round2(htgFee * (1 + SERVICE_FEE_RATE) * (1 + MONCASH_TX_FEE_RATE)),
      walletBalance: currency === "USD" ? walletUsd : walletHtg,
    };
  }, [currency, htgFee, usdFee, feeWaived, walletHtg, walletUsd]);

  const subtotal = isCard ? usdFee : isMoncash ? htgFee : pricing.base;
  const total = isCard
    ? pricing.stripeUsd
    : isMoncash
      ? pricing.moncashHtg
      : pricing.walletTotal;
  const fees = round2(total - subtotal);
  const insufficient = method === "wallet" && walletUsd < pricing.walletTotalUsd;

  const whenLabel = slot
    ? new Date(slot).toLocaleString(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  /**
   * Hold the seat and pay in one action. The hold only has to survive the actual
   * payment, which is what `holdMinutes` was sized for.
   */
  async function holdAndPay() {
    setBusy(true);

    const held = await HoldReservation(
      slug,
      {
        reservedFor: slot!,
        partySize,
        guestName: name.trim(),
        guestEmail: email.trim(),
        guestPhone: phone.trim() || undefined,
        note: note.trim() || undefined,
      },
      locale,
      isLoggedIn ? accessToken : undefined,
    );

    if (held.status !== "success" || !held.reservation) {
      toast.error(
        ("message" in held && held.message) ||
          ("error" in held && held.error) ||
          t("errors.generic"),
      );
      setBusy(false);
      // The table went while they were deciding — send them back to pick again
      // against fresh availability rather than retrying a slot that is gone.
      setStep(0);
      setSlot(null);
      setLoadingSlots(true);
      setReloadToken((n) => n + 1);
      return;
    }

    const reservation = held.reservation;

    if (isCard) {
      const result = await StartReservationStripe(
        reservation.reservationId,
        locale,
        isLoggedIn ? accessToken : undefined,
      );
      if (result.status === "success" && result.clientSecret) {
        setStripeClientSecret(result.clientSecret);
        setStripeOpen(true);
      } else {
        toast.error(
          ("message" in result && result.message) ||
            ("error" in result && result.error) ||
            "",
        );
      }
      setBusy(false);
      return;
    }

    if (isMoncash) {
      const result = await StartReservationMoncash(
        reservation.reservationId,
        locale,
        isLoggedIn ? accessToken : undefined,
      );
      if (result.status === "success" && result.paymentURL) {
        window.location.href = result.paymentURL;
      } else {
        toast.error(
          ("message" in result && result.message) ||
            ("error" in result && result.error) ||
            "",
        );
        setBusy(false);
      }
      return;
    }

    const result = await PayReservationWallet(
      reservation.reservationId,
      accessToken,
      locale,
    );
    if (result.status === "success") {
      router.push(`/explore/reservations/${reservation.reservationCode}`);
      return;
    }
    toast.error(
      ("message" in result && result.message) ||
        ("error" in result && result.error) ||
        "",
    );
    setBusy(false);
  }

  function next() {
    if (step === 0) {
      if (!slot) return toast.error(t("errors.slot"));
      return setStep(1);
    }
    if (step === 1) {
      if (!name.trim()) return toast.error(t("errors.name"));
      if (!email.trim()) return toast.error(t("errors.email"));
      if (!method) return toast.error(ct("payment.paymentType"));
      if (insufficient) return toast.error(t("insufficient"));
      return setStep(2);
    }
    holdAndPay();
  }

  const stepTitles = [t("step_time"), t("step_details"), t("step_summary")];
  const ctaLabel = step === 2 ? t("pay_now") : t("continue");

  const optionClass = (type: Method) =>
    `w-full flex items-center justify-between cursor-pointer p-[15px] rounded-[15px] border transition-all ease-in-out duration-300 ${
      method === type
        ? "border-2 border-primary-500 bg-primary-50"
        : "border-neutral-100 hover:border-primary-500"
    }`;

  return (
    <>
      <PageLoader isLoading={busy} />

      {/* min-h-0 + a scrolling <main> — the layout hides overflow on the white
          card, so without this the page simply cannot scroll. */}
      <div className="h-full min-h-0 flex flex-col">
        <div className="shrink-0 flex flex-col gap-4">
          {step === 0 ? (
            <BackButton text={t("back")} />
          ) : (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex max-w-32 cursor-pointer items-center gap-4"
            >
              <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center">
                <ArrowLeft2 size="20" color="#0d0d0d" variant="Bulk" />
              </div>
              <span className="text-neutral-700 font-normal text-[1.4rem] leading-8">
                {t("back")}
              </span>
            </button>
          )}
          <span className="font-primary font-medium text-[2.6rem] leading-12 text-black mb-4">
            {stepTitles[step]}
          </span>
        </div>

        <main className="flex-1 min-h-0 w-full flex flex-col overflow-y-auto pb-4 gap-10">
          {step === 0 && (
            <>
              <section className="flex flex-col gap-4">
                <h2 className="text-[1.8rem] font-medium leading-10 text-black">
                  {t("party_size")}
                </h2>
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => changeParty(Math.max(1, partySize - 1))}
                    disabled={partySize <= 1}
                    className="w-14 h-14 cursor-pointer rounded-full bg-neutral-100 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus size="18" color="#737C8A" variant="Bulk" />
                  </button>
                  <span className="text-[2rem] font-medium text-deep-100 w-16 text-center">
                    {partySize}
                  </span>
                  <button
                    type="button"
                    onClick={() => changeParty(Math.min(maxParty, partySize + 1))}
                    disabled={partySize >= maxParty}
                    className="w-14 h-14 cursor-pointer rounded-full bg-neutral-100 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Add size="18" color="#737C8A" variant="Bulk" />
                  </button>
                  <span className="text-[1.4rem] text-neutral-600">
                    {t("guests", { count: partySize })}
                  </span>
                </div>
                {partySize >= maxParty && restaurant.maxCoversPerSlot > 0 && (
                  <p className="text-[1.3rem] leading-7 text-neutral-600">
                    {t("max_party", { count: maxParty })}
                  </p>
                )}
              </section>

              {/* Calendar and times side by side on desktop: picking a day and
                  seeing what it opens up is one decision, not two screens. */}
              <div className="flex flex-col lg:grid lg:grid-cols-2 lg:items-start gap-10">
                <section className="flex flex-col gap-4 min-w-0">
                  <h2 className="text-[1.8rem] font-medium leading-10 text-black">
                    {t("date")}
                  </h2>
                  <Calendar
                    month={month}
                    selected={date}
                    openDays={openDays}
                    maxDate={maxDate}
                    locale={locale}
                    onMonthChange={setMonth}
                    onSelect={changeDate}
                    closedLabel={t("closed_day")}
                  />
                </section>

                <section className="flex flex-col gap-4 min-w-0">
                  <h2 className="text-[1.8rem] font-medium leading-10 text-black">
                    {t("time")}
                  </h2>
                  {loadingSlots ? (
                    <div className="py-12 flex justify-center">
                      <LoadingCircleSmall />
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-[1.5rem] leading-8 text-neutral-600 py-6">
                      {t("no_slots")}
                    </p>
                  ) : (
                    <>
                      {/* Every slot struck out is almost always the party being
                          bigger than the venue seats at once — say that instead
                          of leaving a wall of crossed-out times. */}
                      {slots.every((option) => !option.isAvailable) && (
                        <p className="text-[1.4rem] leading-7 text-neutral-600">
                          {t("all_slots_full", { count: partySize })}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3">
                        {slots.map((option) => (
                          <button
                            key={option.startsAt}
                            type="button"
                            // A full slot stays visible but unpickable: seeing
                            // 20:00 is gone beats wondering why it vanished.
                            disabled={!option.isAvailable}
                            onClick={() => setSlot(option.startsAt)}
                            title={
                              option.isAvailable ? undefined : t("slot_full")
                            }
                            className={`px-8 py-4 rounded-[30px] text-[1.5rem] leading-8 font-medium transition-colors ${
                              slot === option.startsAt
                                ? "bg-primary-500 text-white cursor-pointer"
                                : option.isAvailable
                                  ? "bg-neutral-100 text-deep-100 hover:bg-primary-100 cursor-pointer"
                                  : "bg-neutral-100 text-neutral-500 opacity-50 cursor-not-allowed line-through"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </section>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <section className="flex flex-col gap-4 max-w-[520px]">
                <h2 className="text-[1.8rem] font-medium leading-10 text-black">
                  {t("your_details")}
                </h2>
                <p className="text-[1.3rem] leading-7 text-neutral-600">
                  {t("details_hint")}
                </p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder={t("name")}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder={t("email")}
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  placeholder={t("phone")}
                />
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={inputClass}
                  placeholder={t("note")}
                />
              </section>

              <section className="flex flex-col gap-4 max-w-[520px]">
                <h2 className="text-[1.8rem] font-medium leading-10 text-black">
                  {ct("payment.paymentType")}
                </h2>

                {/* Wallet only exists for a signed-in account. */}
                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={() => setMethod("wallet")}
                    className={optionClass("wallet")}
                  >
                    <span className="flex items-center gap-4">
                      <MoneyRecive size="24" color="#E45B00" variant="Bulk" />
                      <span className="text-[1.5rem] leading-8 text-deep-100">
                        {ct("payment.wallet")}
                      </span>
                    </span>
                    <span className="text-[1.4rem] text-neutral-600">
                      {formatMoney(pricing.walletBalance, currency, locale)}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setMethod("card")}
                  className={optionClass("card")}
                >
                  <span className="flex items-center gap-4">
                    <Card size="24" color="#E45B00" variant="Bulk" />
                    <span className="text-[1.5rem] leading-8 text-deep-100">
                      {ct("payment.card")}
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("moncash")}
                  className={optionClass("moncash")}
                >
                  <span className="flex items-center gap-4">
                    <Image
                      src={moncashLogo}
                      alt="MonCash"
                      width={24}
                      height={24}
                    />
                    <span className="text-[1.5rem] leading-8 text-deep-100">
                      MonCash
                    </span>
                  </span>
                </button>

                {insufficient && (
                  <span className="text-[1.3rem] text-failure">
                    {t("insufficient")}
                  </span>
                )}
              </section>
            </>
          )}

          {step === 2 && (
            <section className="flex flex-col gap-6 max-w-[520px]">
              <div className="p-8 rounded-[15px] border border-neutral-100 flex flex-col gap-5">
                <SummaryRow
                  label={t("restaurant_label")}
                  value={restaurant.name}
                />
                <SummaryRow label={t("when_label")} value={whenLabel} />
                <SummaryRow
                  label={t("party_label")}
                  value={t("guests", { count: partySize })}
                />
                <SummaryRow label={t("name_label")} value={name} />
                <SummaryRow label={t("email")} value={email} />
                {phone.trim() && (
                  <SummaryRow label={t("phone")} value={phone} />
                )}
                {note.trim() && <SummaryRow label={t("note")} value={note} />}
              </div>

              <div className="p-8 rounded-[15px] border border-neutral-100 flex flex-col gap-4">
                <div className="flex items-center justify-between text-[1.5rem] text-neutral-600">
                  <span>{ct("summary.subtotal")}</span>
                  <span>
                    {formatMoney(subtotal, displayCurrency, locale)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[1.5rem] text-neutral-600">
                  <span>{ct("summary.transaction_fee")}</span>
                  <span>{formatMoney(fees, displayCurrency, locale)}</span>
                </div>
                <div className="flex items-center justify-between text-[1.8rem] font-medium text-deep-100 border-t border-neutral-100 pt-4">
                  <span>{ct("summary.total")}</span>
                  <span className="text-primary-500">
                    {formatMoney(total, displayCurrency, locale)}
                  </span>
                </div>
              </div>

              <p className="text-[1.3rem] leading-7 text-neutral-600">
                {t("non_refundable")}
              </p>
            </section>
          )}
        </main>

        <div className="shrink-0 mt-3 py-4 px-6 border border-neutral-100 bg-white rounded-[40px] flex items-center w-full justify-between mb-4">
          <div className="hidden lg:flex gap-3 items-center">
            {stepTitles.map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <span
                  className={`text-[1.5rem] leading-12 ${
                    step >= i
                      ? "text-primary-500 font-medium"
                      : "text-neutral-600 font-normal"
                  }`}
                >
                  {label}
                </span>
                {i < stepTitles.length - 1 && (
                  <div
                    className={`w-48 h-2 rounded-[100px] ${
                      step > i ? "bg-primary-500" : "bg-neutral-100"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="text-[2.2rem] lg:hidden leading-12 text-neutral-600">
            <span className="text-primary-500">{step + 1}</span>/3
          </div>

          <ButtonPrimary
            disabled={busy || (step === 0 && !slot)}
            onClick={next}
          >
            {ctaLabel}
          </ButtonPrimary>
        </div>
      </div>

      <Dialog open={stripeOpen} onOpenChange={setStripeOpen}>
        <DialogContent className="max-w-240 max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Stripe</DialogTitle>
          </DialogHeader>
          {stripeClientSecret && (
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ clientSecret: stripeClientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <span className="text-[1.4rem] text-neutral-600 shrink-0">{label}</span>
      <span className="text-[1.5rem] font-medium text-deep-100 text-right">
        {value}
      </span>
    </div>
  );
}
