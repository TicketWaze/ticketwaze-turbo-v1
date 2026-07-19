"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

/**
 * Shared Google sign-in trigger for the attendee app. Uses the full-page
 * next-auth redirect flow (no GIS popup/script), so `isLoading` reflects the
 * moment between the click and the browser navigating to Google — which is what
 * we surface to the user on slow connections.
 */
export function useGoogleSignIn(
  { referralCode, callbackUrl }: { referralCode?: string; callbackUrl?: string } = {},
) {
  const [isLoading, setIsLoading] = useState(false);

  function trigger() {
    if (isLoading) return;
    setIsLoading(true);
    // The redirect flow can't carry referralCode through the callback, so stash
    // it in a short-lived cookie that the next-auth `signIn` callback reads.
    if (referralCode) {
      document.cookie = `referral_code=${encodeURIComponent(
        referralCode,
      )}; Max-Age=1800; Path=/; SameSite=Lax${
        window.location.protocol === "https:" ? "; Secure" : ""
      }`;
    }
    void signIn("google", {
      callbackUrl:
        callbackUrl ?? `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/fr/explore`,
    });
  }

  return { trigger, isLoading };
}
