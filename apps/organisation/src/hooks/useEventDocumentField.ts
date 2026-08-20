"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import type { MembershipTier } from "@ticketwaze/typescript-config";

const MB = 1024 * 1024;

/**
 * State and rules for an online event's optional document.
 *
 * Shared by the create and edit forms. Every rule here is also enforced by the
 * API — this exists so the organiser is told before they have waited out an
 * upload, not instead of the server check. The API remains the authority.
 */
export default function useEventDocumentField({
  membershipTier,
  paidTierName,
  isFree,
}: {
  membershipTier: MembershipTier;
  /**
   * The paid tier's name, or null on a free plan OR a trial.
   *
   * A trial deliberately does NOT unlock this, matching how team seats and sale
   * limits treat trials: the stored bytes outlive a trial that never converts.
   */
  paidTierName: string | null;
  /** Whether the activity itself is free. */
  isFree: boolean;
}) {
  const t = useTranslations("Events.create_event.document");

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** True once the organiser removes a document that was already stored. */
  const [removeExisting, setRemoveExisting] = useState(false);

  const maxFileMb = membershipTier?.eventDocumentMaxMb ?? 0;

  /**
   * A free plan may not attach a document to a FREE event.
   *
   * The combination is what is refused, not either half: that pairing produces
   * no revenue at all to set against storage and egress. A free plan selling
   * tickets may attach one, and so may any paid plan.
   */
  const locked = !paidTierName && isFree;


  const choose = useCallback(
    (chosen: File | null) => {
      if (!chosen) {
        setFile(null);
        setError(null);
        return;
      }
      if (chosen.size > maxFileMb * MB) {
        setFile(null);
        setError(t("errors.tooLarge", { limit: maxFileMb }));
        return;
      }
      if (chosen.size === 0) {
        setFile(null);
        setError(t("errors.empty"));
        return;
      }
      setError(null);
      setFile(chosen);
      // Choosing a replacement is not a removal; the upload overwrites the row.
      setRemoveExisting(false);
    },
    [maxFileMb, t],
  );

  return {
    /*
     * DERIVED, not cleared.
     *
     * Toggling the event to free on a free plan must not upload a file staged
     * before the toggle — the API would refuse it, but only after the event was
     * already created. Masking it here rather than wiping state in an effect
     * avoids a cascading render, and means toggling back to paid restores the
     * organiser's choice instead of silently losing it.
     */
    file: locked ? null : file,
    error: locked ? null : error,
    locked,
    maxFileMb,
    removeExisting,
    choose,
    markExistingRemoved: () => {
      setRemoveExisting(true);
      setFile(null);
      setError(null);
    },
  };
}
