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
  const { update } = useSession();
  const router = useRouter();
  const t = useTranslations("Auth.login");

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

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-6">
        <LoadingCircleSmall />
      </div>
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
