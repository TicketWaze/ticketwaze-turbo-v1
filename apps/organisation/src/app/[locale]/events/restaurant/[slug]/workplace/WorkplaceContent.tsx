"use client";
import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter, Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { Restaurant } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import { AddCircle, Cake, Calendar, Coffee } from "iconsax-reactjs";
import BackButton from "@/components/shared/BackButton";
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
import { ButtonPrimary, ButtonNeutral } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  OpenServiceDay,
  CloseServiceDay,
} from "@/actions/ServiceDayActions";
import TabsBoard from "./TabsBoard";
import type { CatalogItem, CustomerTab, DayTotals, ServiceDay } from "./types";

/**
 * The workplace is the venue's operational surface, separate from the business
 * dashboard: the dashboard answers "how are we doing", this answers "who is
 * here and what do they owe".
 *
 * Everything on it hangs off a trading day the venue opens and closes by hand.
 * Nothing can be recorded outside one, so a night's takings can never merge
 * into the next day's.
 */
export default function WorkplaceContent({
  restaurant,
  slug,
  day,
  totals,
  tabs,
  catalog,
}: {
  restaurant: Restaurant;
  slug: string;
  day: ServiceDay | null;
  totals: DayTotals | null;
  tabs: CustomerTab[];
  catalog: CatalogItem[];
}) {
  const t = useTranslations("Events.workplace");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.user.accessToken ?? "";
  const orgId = restaurant.organisationId;
  const restId = restaurant.restaurantId;

  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<{ error?: string }>) {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (result?.error) {
      toast.error(result.error);
      return false;
    }
    router.refresh();
    return true;
  }

  return (
    <div className="flex flex-col gap-8 overflow-y-scroll pb-12">
      {/* No title: you reached this page from the venue's own dashboard, so
          naming it back at you is a line that earns nothing. */}
      <div className="flex items-center justify-between gap-4">
        <BackButton text={t("back")} />
        <div className="flex items-center gap-3">
          <Link href={`/events/restaurant/${slug}/workplace/sales`}>
            <ButtonNeutral className="py-[7.5px] flex items-center gap-3">
              <Calendar size="18" color="#737C8A" variant="Bulk" />
              {t("sales_history")}
            </ButtonNeutral>
          </Link>
          <AddChoiceDialog slug={slug} />
        </div>
      </div>

      {day ? (
        <>
          <DayHeader
            day={day}
            totals={totals}
            busy={busy}
            locale={locale}
            onClose={(note) =>
              run(() =>
                CloseServiceDay(
                  orgId,
                  restId,
                  day.serviceDayId,
                  token,
                  locale,
                  { note },
                ),
              )
            }
          />
          <TabsBoard restaurant={restaurant} tabs={tabs} catalog={catalog} />
        </>
      ) : (
        <StartDay
          busy={busy}
          onStart={() => run(() => OpenServiceDay(orgId, restId, token, locale))}
        />
      )}
    </div>
  );
}

/**
 * Nothing can be recorded before the day is open — the API refuses the tab, so
 * the UI does not pretend otherwise. One button, one thing to do.
 */
function StartDay({
  busy,
  onStart,
}: {
  busy: boolean;
  onStart: () => Promise<boolean>;
}) {
  const t = useTranslations("Events.workplace");

  return (
    <div className="w-[330px] lg:w-[460px] mx-auto flex flex-col items-center justify-center gap-[5rem] py-20">
      <div className="w-[120px] h-[120px] rounded-full flex items-center justify-center bg-neutral-100">
        <div className="w-[90px] h-[90px] rounded-full flex items-center justify-center bg-neutral-200">
          <Calendar size="50" color="#0d0d0d" variant="Bulk" />
        </div>
      </div>
      <p className="text-[1.8rem] leading-[25px] text-neutral-600 text-center max-w-[330px] lg:max-w-[422px]">
        {t("no_day_open")}
      </p>
      <ButtonPrimary
        className="py-[7.5px] flex items-center gap-3"
        disabled={busy}
        onClick={onStart}
      >
        {busy ? <LoadingCircleSmall /> : t("start_day")}
      </ButtonPrimary>
    </div>
  );
}

/** The day in progress: what it has taken so far, and the way to end it. */
function DayHeader({
  day,
  totals,
  busy,
  locale,
  onClose,
}: {
  day: ServiceDay;
  totals: DayTotals | null;
  busy: boolean;
  locale: string;
  onClose: (note?: string) => Promise<boolean>;
}) {
  const t = useTranslations("Events.workplace");
  const usd = day.currency === "USD";
  const sales = usd ? (totals?.usdTotalSales ?? 0) : (totals?.totalSales ?? 0);
  const cash = usd ? (totals?.usdCashSales ?? 0) : (totals?.cashSales ?? 0);

  const date = new Date(day.businessDate).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="w-full p-6 rounded-[15px] border border-neutral-100 flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
      <div className="flex flex-col gap-1">
        <span className="font-medium font-primary text-[1.8rem] leading-10 text-black capitalize">
          {date}
        </span>
        <span className="text-[1.3rem] leading-7 text-neutral-600">
          {t("day_in_progress")}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-8">
        <Stat label={t("day_sales")} value={formatMoney(sales, day.currency, locale)} />
        <Stat label={t("day_cash")} value={formatMoney(cash, day.currency, locale)} />
        <Stat label={t("day_tabs")} value={String(totals?.tabCount ?? 0)} />
        <CloseDayDialog
          openTabs={totals?.openTabs ?? 0}
          busy={busy}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[1.2rem] text-neutral-600">{label}</span>
      <span className="text-[1.8rem] font-medium leading-8 text-deep-100">
        {value}
      </span>
    </div>
  );
}

/**
 * Ending the day. Open tabs block it — the API refuses and so does this, with
 * the count, because "settle them first" is more useful than a rejected click.
 */
function CloseDayDialog({
  openTabs,
  busy,
  onClose,
}: {
  openTabs: number;
  busy: boolean;
  onClose: (note?: string) => Promise<boolean>;
}) {
  const t = useTranslations("Events.workplace");
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const [note, setNote] = useState("");
  const blocked = openTabs > 0;

  async function confirm() {
    const ok = await onClose(note.trim() || undefined);
    if (ok) {
      setNote("");
      closeRef.current?.click();
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <ButtonPrimary className="py-[7.5px]">{t("close_day")}</ButtonPrimary>
      </DialogTrigger>
      <DialogContent className="w-xl lg:w-208">
        <DialogHeader>
          <DialogTitle className="font-medium border-b border-neutral-100 pb-8 text-[2.6rem] leading-12 text-black font-primary">
            {t("close_day")}
          </DialogTitle>
          <DialogDescription className="sr-only">Close day</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <p className="text-[1.5rem] leading-8 text-neutral-600">
            {blocked
              ? t("close_day_blocked", { count: openTabs })
              : t("close_day_warning")}
          </p>
          {!blocked && (
            <div className="flex flex-col gap-2">
              <label className="text-[1.4rem] font-medium text-neutral-700">
                {t("day_note")}
              </label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="bg-neutral-100 w-full rounded-[1.5rem] p-6 text-[1.5rem] leading-8 placeholder:text-neutral-600 text-deep-200 outline-none border border-transparent focus:border-primary-500"
                placeholder={t("day_note_placeholder")}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <ButtonPrimary
            className="w-full"
            disabled={busy || blocked}
            onClick={confirm}
          >
            {busy ? <LoadingCircleSmall /> : t("close_day")}
          </ButtonPrimary>
          <DialogClose ref={closeRef} className="sr-only" />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * One question, two answers. Whichever they pick leads to that category's page,
 * where they add the entry — so the venue never has to think about menus or
 * sections to get a dish listed.
 */
function AddChoiceDialog({ slug }: { slug: string }) {
  const t = useTranslations("Events.workplace");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function choose(category: "food" | "drink") {
    setOpen(false);
    router.push(`/events/restaurant/${slug}/workplace/add/${category}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ButtonPrimary className="py-[7.5px] flex items-center gap-3">
          <AddCircle size="20" color="#fff" variant="Bulk" />
          {t("add_item")}
        </ButtonPrimary>
      </DialogTrigger>
      <DialogContent className="w-xl lg:w-208">
        <DialogHeader>
          <DialogTitle className="font-medium border-b border-neutral-100 pb-8 text-[2.6rem] leading-12 text-black font-primary">
            {t("add_item")}
          </DialogTitle>
          <DialogDescription className="text-[1.5rem] leading-8 text-neutral-600 pt-4">
            {t("add_choice_hint")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-6 py-6">
          <ChoiceCard
            label={t("food")}
            hint={t("food_hint")}
            icon={<Cake size="34" color="#E45B00" variant="Bulk" />}
            onClick={() => choose("food")}
          />
          <ChoiceCard
            label={t("drink")}
            hint={t("drink_hint")}
            icon={<Coffee size="34" color="#E45B00" variant="Bulk" />}
            onClick={() => choose("drink")}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChoiceCard({
  label,
  hint,
  icon,
  onClick,
}: {
  label: string;
  hint: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 cursor-pointer p-8 rounded-[15px] border border-neutral-100 flex flex-col items-center gap-4 text-center transition-colors hover:border-primary-500"
    >
      <div className="w-[70px] h-[70px] rounded-full bg-neutral-100 flex items-center justify-center">
        {icon}
      </div>
      <span className="font-medium text-[1.8rem] leading-8 text-deep-100">
        {label}
      </span>
      <span className="text-[1.3rem] leading-7 text-neutral-600">{hint}</span>
    </button>
  );
}
