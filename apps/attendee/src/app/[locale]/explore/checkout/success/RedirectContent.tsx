"use client";
import PageLoader from "@/components/PageLoader";
import { User } from "@ticketwaze/typescript-config";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * MonCash return handler (attendee-hosted variant). Settles the transaction via
 * the public finish endpoint and follows the `redirectUrl` the API returns —
 * the exact same contract the payment-app gateway uses, so both return targets
 * behave identically. The endpoint is idempotent, so a refresh/replay is safe.
 */
export default function RedirectContent({
  transactionId,
  user,
}: {
  transactionId: string;
  user?: User;
}) {
  useEffect(function () {
    const fallbackUrl = `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/explore`;

    if (!transactionId) {
      window.location.href = fallbackUrl;
      return;
    }

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
        if (res.status === "success") {
          toast.success(
            res.raffle
              ? "Your entries have been confirmed. Good luck in the draw!"
              : "Your tickets have been sent to your email. If you don't see them, check your spam folder.",
          );
        } else {
          toast.error("Failed to retrieve payment");
        }
        // redirectUrl is an absolute URL (may be a different origin), so a hard
        // navigation is required rather than the localized client router.
        window.location.href = res.redirectUrl ?? fallbackUrl;
      })
      .catch(() => {
        toast.error("Failed to retrieve payment");
        window.location.href = fallbackUrl;
      });
  }, []);
  return (
    <>
      <PageLoader isLoading={true} />
    </>
  );
}
