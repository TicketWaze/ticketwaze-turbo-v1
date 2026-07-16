"use client";
import { useEffect, useRef, useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import LoadingCircleSmall from "./LoadingCircleSmall";

interface Props {
  referralCode?: string;
  callbackUrl?: string;
}

export default function GoogleSignInButton({ referralCode, callbackUrl }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [buttonWidth, setButtonWidth] = useState(0);
  // null = not yet determined (avoids rendering the wrong flow during SSR/hydration)
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const { update } = useSession();
  const router = useRouter();
  const t = useTranslations("Auth.login");

  // The GIS popup / ID-token button (@react-oauth/google) is unreliable on
  // mobile: it depends on the original tab surviving to receive Google's
  // postMessage. When the user has many accounts (heavier account chooser) or
  // the tab is discarded under memory pressure / an in-app browser, the return
  // lands on the browser's "Can't open this page". Mobile users get the
  // full-page next-auth redirect flow instead, which has no opener to lose.
  useEffect(() => {
    const coarse =
      typeof window !== "undefined" &&
      window.matchMedia?.("(pointer: coarse)").matches;
    const uaMobile =
      typeof navigator !== "undefined" &&
      /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsMobile(Boolean(coarse || uaMobile));
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry)
        setButtonWidth(Math.min(400, Math.floor(entry.contentRect.width)));
    });
    observer.observe(containerRef.current);
    setButtonWidth(Math.min(400, Math.floor(containerRef.current.offsetWidth)));
    return () => observer.disconnect();
  }, []);

  function handleMobileSignIn() {
    if (isLoading) return;
    setIsLoading(true);
    // The redirect flow can't carry referralCode through the callback like the
    // popup does. Stash it in a short-lived cookie that the next-auth `signIn`
    // callback reads server-side when it creates the account.
    if (referralCode) {
      document.cookie = `referral_code=${encodeURIComponent(
        referralCode,
      )}; Max-Age=1800; Path=/; SameSite=Lax${
        window.location.protocol === "https:" ? "; Secure" : ""
      }`;
    }
    // Full-page redirect to Google and back. Middleware routes un-onboarded
    // users to /auth/onboarding, so a plain /explore callback is safe.
    void signIn("google", {
      callbackUrl:
        callbackUrl ?? `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/fr/explore`,
    });
  }

  async function handleSuccess(credentialResponse: CredentialResponse) {
    if (!credentialResponse.credential || isLoading) return;
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        googleIdToken: credentialResponse.credential,
        referralCode: referralCode ?? "",
        redirect: false,
      });
      if (result?.error) {
        toast.error("Google sign-in failed, please try again");
        return;
      }
      const session = await update();

      // update() can return null in NextAuth v5 if the session cookie hasn't
      // been flushed yet. Fall back to a hard redirect so the page reinitialises
      // with the fresh cookie rather than acting on a stale/null session.
      if (!session) {
        window.location.href = callbackUrl
          ? callbackUrl
          : `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/fr/explore`;
        return;
      }

      if (session.user.deletionCancelled) {
        toast.success(t("deletionCancelled"));
        update({ user: { deletionCancelled: false } });
      }
      if (!session.user.isOnboarded) {
        router.push("/auth/onboarding");
      } else if (callbackUrl) {
        router.push(callbackUrl, { locale: session.user.userPreference?.appLanguage ?? "fr" });
      } else {
        const locale = session.user.userPreference?.appLanguage ?? "fr";
        window.location.href = `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/explore`;
      }
    } catch {
      toast.error("Google sign-in failed, please try again");
    } finally {
      setIsLoading(false);
    }
  }

  function handleError() {
    toast.error("Google sign-in failed, please try again");
  }

  if (isLoading || isMobile === null) {
    return (
      <div className="w-full flex justify-center py-6">
        <LoadingCircleSmall />
      </div>
    );
  }

  // Mobile: full-page redirect flow via next-auth. Styled to mirror the GIS
  // "filled_black" pill button used on desktop so the two look consistent.
  if (isMobile) {
    return (
      <button
        type="button"
        onClick={handleMobileSignIn}
        className="w-full max-w-[400px] mx-auto flex items-center justify-center gap-3 h-[44px] rounded-full bg-black text-white font-medium text-[1.5rem] leading-8 hover:bg-neutral-800 transition-colors"
      >
        <span className="w-[20px] h-[20px] rounded-full bg-white flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
        </span>
        {t("method.google")}
      </button>
    );
  }

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      {buttonWidth > 0 && (
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          theme="filled_black"
          size="large"
          shape="pill"
          text="continue_with"
          width={String(buttonWidth)}
        />
      )}
    </div>
  );
}
