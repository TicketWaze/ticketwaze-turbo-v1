"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { clearGoogleSignup, markGoogleSignup } from "./googleSignupIntent";

/**
 * Shared Google sign-in trigger for the organisation app. Uses the full-page
 * next-auth redirect flow, so `isLoading` reflects the moment between the click
 * and the browser navigating to Google — surfaced to the user on slow networks.
 *
 * `signup` (the register page) only decides where a failure is reported;
 * either way a Google address without an account gets one.
 */
export function useGoogleSignIn({
  callbackUrl,
  signup = false,
}: {
  callbackUrl: string;
  signup?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);

  function trigger() {
    if (isLoading) return;
    setIsLoading(true);
    if (signup) markGoogleSignup();
    else clearGoogleSignup();
    void signIn("google", { callbackUrl });
  }

  return { trigger, isLoading };
}
