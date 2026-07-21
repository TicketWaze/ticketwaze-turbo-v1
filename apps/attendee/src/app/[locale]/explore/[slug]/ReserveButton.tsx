"use client";
import {
  ReservePlaceAction,
  CancelReservationAction,
} from "@/actions/eventActions";
import NoAuthDialog from "@/components/Layouts/NoAuthDialog";
import PageLoader from "@/components/PageLoader";
import { ButtonPrimary } from "@/components/shared/buttons";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { usePathname } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Reserve / cancel a place on a coming-soon activity.
 *
 * A teaser has no tickets to sell, so this replaces the buy CTA. Signed-out
 * visitors get the sign-in dialog rather than a disabled button — the same
 * treatment FollowButton gives them, and the reason the feature can be
 * logged-in-only without ever showing a dead end.
 */
export default function ReserveButton({
  eventId,
  initialHasReserved,
  initialCount,
}: {
  eventId: string;
  initialHasReserved: boolean;
  initialCount: number;
}) {
  // Not "Event.reserve" — that namespace is already the restaurant table
  // booking flow, and a second block under the same key silently replaces one
  // of the two depending on file order.
  const t = useTranslations("Event.reserve_place");
  const locale = useLocale();
  const pathname = usePathname();
  const { data: session } = useSession();

  // Local state so the button flips immediately; the page data behind it comes
  // from a cached payload and will not re-render on its own.
  const [hasReserved, setHasReserved] = useState(initialHasReserved);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  async function toggle() {
    const token = session?.user?.accessToken;
    if (!token || isLoading) return;

    const next = !hasReserved;
    setHasReserved(next); // optimistic
    setCount((current) => Math.max(0, current + (next ? 1 : -1)));
    setIsLoading(true);

    const response = next
      ? await ReservePlaceAction(token, eventId, pathname, locale)
      : await CancelReservationAction(token, eventId, pathname, locale);

    setIsLoading(false);

    if ("status" in response && response.status === "success") {
      // Trust the server's count over the optimistic guess.
      if (typeof response.reservationCount === "number") {
        setCount(response.reservationCount);
      }
      toast.success(next ? t("reserved_toast") : t("cancelled_toast"));
      return;
    }

    // Revert on failure.
    setHasReserved(!next);
    setCount((current) => Math.max(0, current + (next ? -1 : 1)));
    toast.error(
      ("error" in response && response.error) || "Something went wrong",
    );
  }

  const label = (
    <span className="flex flex-col items-center leading-tight">
      <span>{hasReserved ? t("reserved") : t("cta")}</span>
    </span>
  );

  if (!session?.user) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <ButtonPrimary>{label}</ButtonPrimary>
        </DialogTrigger>
        <NoAuthDialog callbackUrl={pathname} />
      </Dialog>
    );
  }

  return (
    <>
      <PageLoader isLoading={isLoading} />
      {hasReserved ? (
        <button
          disabled={isLoading}
          onClick={toggle}
          className="py-[7.5px] px-12 rounded-[100px] cursor-pointer border-2 border-black text-[1.4rem] leading-8 text-black disabled:opacity-50"
        >
          {label}
        </button>
      ) : (
        <ButtonPrimary disabled={isLoading} onClick={toggle}>
          {label}
        </ButtonPrimary>
      )}
    </>
  );
}
