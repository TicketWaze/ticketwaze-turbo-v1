"use client";
import { useState } from "react";
import { Send2 } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { ShareDialog } from "@ticketwaze/ui/share";
import { slugify } from "@/lib/Slugify";
import { cn } from "@/lib/utils";
import { Event } from "@ticketwaze/typescript-config";
import { trackEngagement } from "@/lib/engagement";

/**
 * The share button of the attendee pages. It opens the shared share modal
 * (@ticketwaze/ui, the organisation dashboard's): WhatsApp and X carry the
 * activity's own description, and an event also gets the Instagram poster.
 */
export default function ShareEvent({
  event,
  url,
  title,
  description,
  activityId,
  triggerClassName,
}: {
  event?: Event;
  url?: string;
  /** The shared thing's name; defaults to `event`'s. */
  title?: string;
  /** Its description (HTML is fine); defaults to `event`'s. */
  description?: string | null;
  /**
   * The activity being shared, for the organiser's share count. Defaults to
   * `event`'s id; left out (e.g. sharing an organisation) nothing is reported.
   */
  activityId?: string;
  /**
   * Overrides on the trigger, merged through `cn` so they beat the defaults.
   * Lets a caller size the button to whatever it sits beside — the default pill
   * is tuned for the event action bar and does not match every row.
   */
  triggerClassName?: string;
}) {
  const t = useTranslations("Event");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const sharedId = activityId ?? event?.eventId;
  const link =
    url ??
    (event
      ? `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/explore/${slugify(event.eventName, event.eventId)}`
      : "");
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        <span
          className={cn(
            "p-[7.5px] border-2 border-transparent rounded-[100px] text-center font-medium text-[1.4rem] h-auto leading-8 cursor-pointer transition-all duration-400 flex items-center justify-center gap-4 bg-neutral-100 text-neutral-700",
            triggerClassName,
          )}
        >
          <Send2 variant={"Bulk"} color={"#737C8A"} size={20} />
          <span className="hidden lg:inline">{t("share")}</span>
        </span>
      </button>
      <ShareDialog
        open={open}
        onOpenChange={setOpen}
        link={link}
        title={title ?? event?.eventName}
        description={description ?? event?.eventDescription}
        locale={locale}
        event={event}
        kind={sharedId ? "activity" : "profile"}
        onShare={(channel) => {
          if (sharedId) trackEngagement(sharedId, "share", channel);
        }}
      />
    </>
  );
}
