"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { toast } from "sonner";
import { DiscountCode, Event } from "@ticketwaze/typescript-config";
import { ButtonPill } from "@/components/shared/buttons";
import { Reveal, tabSpring } from "@/components/shared/motion";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import MountOnOpen from "@/components/shared/MountOnOpen";
import DiscountCodeTable, { codeState } from "./DiscountCodeTable";

// Downloaded on first open: the form's validation and the share dialog's QR
// and poster rendering are heavy, and most visits only read the table.
const ShareEvent = dynamic(() => import("../components/ShareEvent"), {
  ssr: false,
});
const AddDiscountDrawer = dynamic(() => import("./AddDiscountDrawer"), {
  ssr: false,
});

type Tab = "all" | "active" | "inactive";

/**
 * An activity's discount codes (post-design, restyled to the event page):
 * title + "Add discount code", All / Active / Inactive with the sliding pill,
 * then the codes. Active means usable right now or scheduled to be; expired,
 * used-up and switched-off codes are inactive.
 */
export default function DiscountPageContent({ event }: { event: Event }) {
  const t = useTranslations("Events.single_event.discount");
  const codes: DiscountCode[] = useMemo(
    () =>
      [...(event.discountCodes ?? [])].sort((a, b) =>
        String(b.createdAt).localeCompare(String(a.createdAt)),
      ),
    [event.discountCodes],
  );
  const [tab, setTab] = useState<Tab>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const groups = useMemo(() => {
    const active = codes.filter((c) => {
      const s = codeState(c);
      return s === "live" || s === "scheduled";
    });
    return {
      all: codes,
      active,
      inactive: codes.filter((c) => !active.includes(c)),
    };
  }, [codes]);

  function share(code: string) {
    // Not awaited: Share opens at once, the toast confirms the copy.
    navigator.clipboard
      ?.writeText(code)
      .then(() => toast.success(t("code_copied", { code })))
      .catch(() => {});
    setAddOpen(false);
    setShareOpen(true);
  }

  const tabs: { value: Tab; label: string }[] = [
    { value: "all", label: t("all") },
    { value: "active", label: t("active") },
    { value: "inactive", label: t("inactive") },
  ];

  return (
    <div className="flex flex-col gap-10 lg:gap-12 pb-16 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <Reveal
        y={-12}
        className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex flex-col gap-2 min-w-0">
          <h1 className="font-primary font-medium text-[2.2rem] lg:text-[2.6rem] leading-[1.2] text-black">
            {t("page_title")}
          </h1>
          <p className="font-sans text-[1.4rem] leading-8 text-neutral-600 truncate">
            {t("page_description", { name: event.eventName })}
          </p>
        </div>
        <ButtonPill
          tone="primary"
          onClick={() => setAddOpen(true)}
          className="w-fit"
        >
          {t("title")}
        </ButtonPill>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="flex items-center bg-neutral-100 rounded-[3rem] p-[.75rem] w-fit max-w-full overflow-x-auto">
          {tabs.map((o) => {
            const active = tab === o.value;
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={active}
                onClick={() => setTab(o.value)}
                className={cn(
                  "relative px-6 py-2 rounded-[3rem] font-sans text-[1.4rem] leading-8 whitespace-nowrap cursor-pointer transition-colors duration-200",
                  active
                    ? "text-white"
                    : "text-neutral-700 hover:text-deep-100",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="discount-tab"
                    className="absolute inset-0 rounded-[3rem] bg-black"
                    transition={tabSpring}
                  />
                )}
                <span className="relative">
                  {o.label}
                  <span
                    className={cn(
                      "ml-2",
                      active ? "text-white/60" : "text-neutral-500",
                    )}
                  >
                    {groups[o.value].length}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Reveal>

      <DiscountCodeTable
        key={tab}
        activityId={event.eventId}
        codes={groups[tab]}
        currency={event.currency}
        timezone={event.eventDays[0]?.timezone}
        emptyMessage={
          tab === "all"
            ? t("empty")
            : tab === "active"
              ? t("empty_active")
              : t("empty_inactive")
        }
        onAdd={tab === "all" ? () => setAddOpen(true) : undefined}
      />

      <MountOnOpen open={addOpen}>
        <AddDiscountDrawer
          event={event}
          open={addOpen}
          onOpenChange={setAddOpen}
          onShare={share}
        />
      </MountOnOpen>
      <MountOnOpen open={shareOpen}>
        <ShareEvent
          event={event}
          open={shareOpen}
          onOpenChange={setShareOpen}
        />
      </MountOnOpen>
    </div>
  );
}
