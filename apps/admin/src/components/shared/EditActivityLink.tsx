"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { ButtonBlack } from "@/components/shared/buttons";

/**
 * The "Edit" button on an activity's admin page.
 *
 * One component for all four kinds, because the only thing that differs is the
 * href. It renders nothing without `activity.manage` — the API enforces the
 * permission and the edit page redirects without it, so this is purely about
 * not showing a door that will be shut in the admin's face.
 *
 * `disabled` covers the cases where the activity itself is closed to editing
 * (a drawn raffle, a cancelled event): the reason is worth showing rather than
 * hiding the button and leaving the admin wondering where it went.
 */
export default function EditActivityLink({
  href,
  disabledReason,
  className,
}: {
  href: string;
  disabledReason?: string | null;
  className?: string;
}) {
  const t = useTranslations("Activities");
  const { data: session } = useSession();

  const canManage = (
    (session?.user.effectivePermissionKeys ?? []) as string[]
  ).includes("activity.manage");

  if (!canManage) return null;

  if (disabledReason) {
    return (
      <ButtonBlack
        disabled
        title={disabledReason}
        className={`w-full lg:w-fit opacity-50 cursor-not-allowed ${className ?? ""}`}
      >
        {t("activity.edit")}
      </ButtonBlack>
    );
  }

  return (
    <Link href={href} className={className}>
      <ButtonBlack className="w-full lg:w-fit">{t("activity.edit")}</ButtonBlack>
    </Link>
  );
}
