"use client";
import PageLoader from "@/components/PageLoader";
import { useRouter } from "@/i18n/navigation";
import { slugify } from "@/lib/Slugify";
import { User } from "@ticketwaze/typescript-config";
import { useEffect } from "react";
import { toast } from "sonner";

export default function RedirectContent({
  transactionId,
  user,
}: {
  transactionId: string;
  user?: User;
}) {
  const router = useRouter();

  useEffect(function () {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (user?.accessToken) {
      headers["Authorization"] = `Bearer ${user.accessToken}`;
    }
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/payments/moncash/success/${transactionId}`,
      { method: "GET", headers },
    )
      .then((res) => res.json())
      .then((res) => {
        // Raffle orders come back with a `raffle` payload instead of `event`.
        if (res.raffle) {
          const raffleSlug = slugify(res.raffle.title, res.raffle.raffleId);
          if (res.status === "success") {
            toast.success(
              "Your entries have been confirmed. Good luck in the draw!",
            );
            router.push(`/explore/raffle/${raffleSlug}?from=checkout`);
          } else {
            toast.error("Failed to retrieve payment");
            router.push(`/explore/raffle/${raffleSlug}`);
          }
          return;
        }
        const eventSlug = slugify(res.event.eventName, res.event.eventId);
        if (res.status === "success") {
          toast.success(
            "Your tickets have been sent to your email. If you don't see them, check your spam folder.",
          );
          router.push(
            user
              ? `/upcoming/${eventSlug}?from=checkout`
              : `/explore/checkout/guest-success?slug=${eventSlug}`,
          );
        } else {
          toast.error("Failed to retrieve payment");
          router.push(`/explore/${eventSlug}`);
        }
      });
  }, []);
  return (
    <>
      <PageLoader isLoading={true} />
    </>
  );
}
