"use client";
import { useEffect, useRef, useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
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
        referralCode: referralCode ?? "",
        redirect: false,
      });
      if (result?.error) {
        toast.error("Google sign-in failed, please try again");
        return;
      }
      const session = await update();
      if (!session?.user.isOnboarded) {
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
