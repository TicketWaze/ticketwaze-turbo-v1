"use client";

import { Warning2 } from "iconsax-reactjs";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

/**
 * Shown on every page while the signed-in account is suspended.
 *
 * A suspended attendee keeps their account and their tickets, so nothing about
 * the interface looks broken — which is precisely the problem this solves. With
 * no banner, the first thing they learn is that a purchase failed, with no
 * reason given and nothing to do about it. Stating the sanction, its reason and
 * the way to appeal is the difference between a decision and a malfunction.
 *
 * Reads suspension straight from the session, which the token refresh keeps
 * current, so it appears within one access-token period of the suspension and
 * disappears the same way when the account is reinstated.
 */
export default function SuspensionBanner() {
  const t = useTranslations("Suspension");
  const { data: session } = useSession();

  if (!session?.user?.isSuspended) return null;

  const reason = session.user.suspensionReason;

  return (
    <div className="flex flex-col gap-4 bg-red-50 border border-red-300 rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <Warning2
          size="24"
          color="#DC2626"
          variant="Bulk"
          className="shrink-0 mt-1"
        />
        <div className="flex flex-col gap-2 flex-1">
          <span className="font-medium text-[1.6rem] leading-8 text-red-800">
            {t("title")}
          </span>
          <p className="text-[1.4rem] leading-7 text-red-700">
            {t("description")}
          </p>
          {reason && (
            <p className="text-[1.4rem] leading-7 text-red-700">
              {t("reason_label")}: &ldquo;{reason}&rdquo;
            </p>
          )}
        </div>
      </div>
      <a
        href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/support`}
        className="self-start px-6 py-3 rounded-[100px] border-2 border-red-500 text-red-700 text-[1.4rem] font-medium leading-8 hover:bg-red-100 transition-colors"
      >
        {t("cta")}
      </a>
    </div>
  );
}
