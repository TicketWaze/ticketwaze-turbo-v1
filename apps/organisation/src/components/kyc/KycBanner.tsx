"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { Clock, CloseCircle, ShieldSecurity, Warning2 } from "iconsax-reactjs";
import type { KycStatus } from "@ticketwaze/typescript-config";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";
import {
  fetchKycStatus,
  readCachedKyc,
  writeCachedKyc,
  type KycState,
} from "@/lib/kyc";

const DISMISS_KEY = "tw:kyc-banner-dismissed";
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** Dismissal lasts the browser session and only for the status it was seen in. */
function dismissedFor(): string | null {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY);
  } catch {
    return null;
  }
}

/**
 * Top-of-dashboard notice while the organisation isn't KYC-approved: what is
 * locked, and the way to unlock it (only owners can submit).
 */
export default function KycBanner() {
  const t = useTranslations("Auth.kyc.banner");
  const locale = useLocale();
  const { data: session } = useSession();
  const { can } = usePermission();
  const organisationId = session?.activeOrganisation?.organisationId;
  const accessToken = session?.user?.accessToken;
  const [kyc, setKyc] = useState<KycState | null>(null);
  const dismissed = useSyncExternalStore(subscribe, dismissedFor, () => null);

  // Approval happens elsewhere (admin review), so the session's copy of the
  // organisation can't be trusted for this; a short-lived browser copy can
  // (see readCachedKyc), and spares a request on every page.
  useEffect(() => {
    if (!organisationId || !accessToken) return;
    const cached = readCachedKyc(organisationId);
    let cancelled = false;
    const pending = cached
      ? Promise.resolve(cached)
      : fetchKycStatus(organisationId, accessToken, locale).then((state) => {
          if (state) writeCachedKyc(organisationId, state);
          return state;
        });
    pending.then((state) => {
      if (!cancelled) setKyc(state);
    });
    return () => {
      cancelled = true;
    };
  }, [organisationId, accessToken, locale]);

  if (!kyc || kyc.status === "approved") return null;
  const status: KycStatus = kyc.status;
  const canVerify = can("organisation.manage");
  const rejectionReason = kyc.rejectionReason;

  const pending = status === "pending";
  const rejected = status === "rejected";
  const Icon = pending ? Clock : rejected ? Warning2 : ShieldSecurity;
  const text = !canVerify
    ? t("member")
    : pending
      ? t("pending")
      : rejected
        ? t("rejected", { reason: rejectionReason ?? "" })
        : t("unverified");

  function dismiss() {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, status);
    } catch {}
    for (const listener of listeners) listener();
  }

  return (
    <AnimatePresence initial={false}>
      {dismissed !== status && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: -32 }}
          transition={{ duration: 0.25 }}
          role="status"
          className={cn(
            "shrink-0 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6 rounded-[2rem] px-6 py-5 border",
            rejected
              ? "bg-[#FFF1F1] border-failure/30"
              : "bg-primary-50 border-primary-100",
          )}
        >
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <Icon
              size={22}
              variant="Bulk"
              color={rejected ? "#E53935" : "#E45B00"}
              className="shrink-0 mt-[0.1rem]"
            />
            <p className="text-[1.4rem] leading-[2.2rem] text-deep-100">{text}</p>
          </div>
          <div className="flex items-center gap-4 self-end lg:self-auto shrink-0">
            {canVerify && !pending && (
              <Link
                href="/auth/verification"
                className="h-[4rem] px-8 rounded-[10rem] bg-primary-500 text-white text-[1.4rem] font-medium flex items-center hover:bg-primary-600 transition-colors whitespace-nowrap"
              >
                {rejected ? t("resubmit") : t("verify")}
              </Link>
            )}
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
              className="text-neutral-500 hover:text-neutral-800 transition-colors"
            >
              <CloseCircle size={22} variant="Bulk" color="currentColor" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
