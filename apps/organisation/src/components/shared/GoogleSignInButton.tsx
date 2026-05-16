"use client";
import { useEffect, useRef, useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import LoadingCircleSmall from "./LoadingCircleSmall";

export default function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [buttonWidth, setButtonWidth] = useState(0);
  const { update } = useSession();

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
    if (!credentialResponse.credential) return;
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        googleIdToken: credentialResponse.credential,
        redirect: false,
      });
      if (result?.error) {
        toast.error(
          "You need a TicketWaze account to sign in here. Please create an account first.",
        );
        return;
      }
      const data = await update();
      const locale = data?.user.userPreference.appLanguage;
      window.location.href = `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${locale}/auth/onboarding`;
    } catch {
      toast.error(
        "You need a TicketWaze account to sign in here. Please create an account first.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleError() {
    toast.error(
      "You need a TicketWaze account to sign in here. Please create an account first.",
    );
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
