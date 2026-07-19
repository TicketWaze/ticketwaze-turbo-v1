"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ButtonPrimary, ButtonNeutral } from "@/components/shared/buttons";
import { isAnalyticsEnabled } from "@/lib/analytics";
import { useConsent } from "./ConsentProvider";

/**
 * Cookie-consent banner. Shows only while analytics is configured AND the
 * visitor has not yet chosen. "Reject" persists the choice and keeps GA from
 * ever mounting; "Accept" mounts GA and flips Consent Mode to granted.
 */
export function CookieConsentBanner() {
  const t = useTranslations("Consent");
  const { consent, setConsent } = useConsent();

  // Decide whether to show the banner only after the client has mounted and read
  // the saved choice. The server/hydration render always sees consent "unknown",
  // so without this gate the banner flashes for a frame even for visitors who
  // already accepted or rejected.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Nothing to consent to when analytics is disabled (dev / no real ID).
  if (!mounted || !isAnalyticsEnabled() || consent !== "unknown") return null;

  return (
    <div
      role="dialog"
      aria-label={t("aria")}
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-[560px] rounded-[20px] border border-neutral-100 bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.12)] flex flex-col gap-5"
    >
      <p className="text-[1.5rem] leading-8 text-neutral-700">{t("message")}</p>
      <div className="flex items-center justify-end gap-3">
        <ButtonNeutral
          onClick={() => setConsent("denied")}
          className="px-8 py-4 text-[1.4rem]"
        >
          {t("reject")}
        </ButtonNeutral>
        <ButtonPrimary
          onClick={() => setConsent("granted")}
          className="px-8 py-4 text-[1.4rem]"
        >
          {t("accept")}
        </ButtonPrimary>
      </div>
    </div>
  );
}
