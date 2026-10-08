"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import LoadingCircleSmall from "./LoadingCircleSmall";

/**
 * Figma's black "Continue with Google" pill. Full-page next-auth redirect
 * flow (matches the attendee/organisation apps): the GIS popup button was
 * unreliable, and the redirect has no opener tab to lose. Failures come back
 * to /auth/login?error=<code> (see the signIn callback in lib/auth.ts).
 */
export default function GoogleSignInButton() {
  const t = useTranslations("Auth.login");
  const [isLoading, setIsLoading] = useState(false);
  const locale = useLocale();

  function handleSignIn() {
    if (isLoading) return;
    setIsLoading(true);
    void signIn("google", {
      callbackUrl: `${process.env.NEXT_PUBLIC_ADMIN_URL}/${locale}/analytics`,
    });
  }

  return (
    <button
      type="button"
      onClick={handleSignIn}
      disabled={isLoading}
      className="w-full h-[6rem] flex items-center justify-center gap-4 rounded-[10rem] border-2 border-black bg-linear-to-b from-[#2B2B2B] to-black text-white font-medium text-[1.5rem] leading-8 cursor-pointer transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-70 disabled:cursor-default"
    >
      {isLoading ? (
        <LoadingCircleSmall />
      ) : (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {t("google")}
        </>
      )}
    </button>
  );
}
