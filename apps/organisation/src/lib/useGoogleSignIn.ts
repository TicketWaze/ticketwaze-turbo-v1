"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

/**
 * Shared Google sign-in trigger for the organisation app. Uses the full-page
 * next-auth redirect flow, so `isLoading` reflects the moment between the click
 * and the browser navigating to Google — surfaced to the user on slow networks.
 */
export function useGoogleSignIn({ callbackUrl }: { callbackUrl: string }) {
  const [isLoading, setIsLoading] = useState(false);

  function trigger() {
    if (isLoading) return;
    setIsLoading(true);
    void signIn("google", { callbackUrl });
  }

  return { trigger, isLoading };
}
