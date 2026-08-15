"use client";
import { Event } from "@ticketwaze/typescript-config";
import { VideoPlay } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";

/**
 * OPENS THE ORGANISER'S OWN WAY INTO THEIR ONLINE EVENT.
 *
 * Takes the place the scan-tickets button occupies for in-person events, which
 * is free here because check-in is disabled for online activities.
 *
 * **Why a button and not a schedule.** Neither Zoom nor Google Meet can be
 * started remotely — there is no API for it on either. A host has to open the
 * call, so the useful thing a platform can do is put that link one click away
 * at the moment it is needed, rather than leave the organiser hunting for it in
 * Zoom's own app while attendees wait.
 *
 * The link is requested per click rather than embedded in the page: Zoom's host
 * URL carries host control in an embedded token and is short-lived, so it is
 * never stored, cached or rendered into HTML.
 */
export default function StartMeetingButton({ event }: { event: Event }) {
  const t = useTranslations("Events.single_event");
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  async function openMeeting() {
    if (isLoading) return;
    setIsLoading(true);

    /**
     * The tab is opened BEFORE the await, then pointed at the link once it
     * arrives. Browsers only treat `window.open` as user-initiated inside the
     * click itself, so opening after the fetch resolves is blocked as a popup —
     * which would look like the button doing nothing.
     */
    const tab = window.open("", "_blank");

    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${event.eventId}/host-link`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user.accessToken}`,
          },
          cache: "no-store",
        },
      );
      const response = await request.json();

      if (response.status === "success" && response.hostUrl) {
        if (tab) tab.location.href = response.hostUrl;
        else window.location.href = response.hostUrl;
      } else {
        tab?.close();
        toast.error(response.message ?? t("start_meeting_failed"));
      }
    } catch {
      tab?.close();
      toast.error(t("start_meeting_failed"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full lg:w-fit">
      <ButtonPrimary
        className="gap-4 w-full"
        onClick={openMeeting}
        disabled={isLoading}
      >
        {isLoading ? (
          <LoadingCircleSmall />
        ) : (
          <>
            <VideoPlay variant={"Bulk"} color={"#fff"} size={20} />
            {t("start_meeting")}
          </>
        )}
      </ButtonPrimary>
    </div>
  );
}
