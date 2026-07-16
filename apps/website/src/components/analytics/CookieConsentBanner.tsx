"use client";

import { useTranslations } from "next-intl";
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

  // Nothing to consent to when analytics is disabled (dev / no real ID).
  if (!isAnalyticsEnabled() || consent !== "unknown") return null;

  return (
    <div
      role="dialog"
      aria-label={t("aria")}
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-[560px] rounded-[20px] border border-neutral-200 bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.12)] flex flex-col gap-5"
    >
      <p className="text-[1.5rem] leading-8 text-neutral-700">{t("message")}</p>
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setConsent("denied")}
          className="px-8 py-3 rounded-[100px] border border-neutral-200 text-neutral-700 font-medium text-[1.4rem] hover:border-primary-500 hover:text-primary-500 transition-colors"
        >
          {t("reject")}
        </button>
        <button
          type="button"
          onClick={() => setConsent("granted")}
          className="px-8 py-3 rounded-[100px] bg-primary-500 text-white font-medium text-[1.4rem] hover:bg-primary-500/80 transition-colors"
        >
          {t("accept")}
        </button>
      </div>
    </div>
  );
}
