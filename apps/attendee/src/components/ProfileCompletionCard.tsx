"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { ProfileCircle } from "iconsax-reactjs";
import { Link } from "@/i18n/navigation";

type ProfileField =
  | "username"
  | "address"
  | "country"
  | "state"
  | "city"
  | "dateOfBirth"
  | "gender";

type ProfileCompletion = {
  missing: ProfileField[];
  total: number;
  showNotice: boolean;
};

/** Field → its label in Auth.flow.setup, the keys the Profile page uses. */
const FIELD_LABEL: Record<ProfileField, string> = {
  username: "username",
  address: "address",
  country: "country",
  state: "state",
  city: "city",
  dateOfBirth: "dob",
  gender: "gender",
};

/**
 * "Complete your profile", at the top of Explore.
 *
 * This is the weekly nudge; the email only goes out every 90 days. The API
 * decides whether it shows (`profileCompletion.showNotice` on /users/me): not
 * once every set-up field is filled, and not for seven days after "Later" —
 * the dismissal is stored on the account, so it holds on every device.
 */
export default function ProfileCompletionCard() {
  const t = useTranslations("ProfileNotice");
  const tSetup = useTranslations("Auth.flow.setup");
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [completion, setCompletion] = useState<ProfileCompletion | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.profileCompletion)
          setCompletion(data.profileCompletion);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!completion?.showNotice) return null;

  const done = completion.total - completion.missing.length;

  async function dismiss() {
    // Hidden at once; a failed request only means it shows again next visit.
    setCompletion(null);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/profile-notice`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }

  return (
    <div className="flex flex-col gap-6 bg-primary-50 border border-primary-200 rounded-[2.4rem] p-6 lg:p-8 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-start gap-4">
        <ProfileCircle
          size="28"
          variant="Bulk"
          className="shrink-0 text-primary-500"
          color="currentColor"
        />
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <span className="font-medium text-[1.6rem] leading-8 text-deep-100">
            {t("title", { done, total: completion.total })}
          </span>
          <p className="text-[1.4rem] leading-7 text-neutral-700">
            {t("description")}
          </p>
          <div
            className="h-2 rounded-full bg-primary-100 overflow-hidden mt-2"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={completion.total}
            aria-valuenow={done}
          >
            <div
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${(done / completion.total) * 100}%` }}
            />
          </div>
          <ul className="flex flex-wrap gap-2 mt-2">
            {completion.missing.map((field) => (
              <li
                key={field}
                className="px-4 py-1 rounded-full bg-white border border-primary-200 text-[1.3rem] leading-7 text-primary-600"
              >
                {tSetup(FIELD_LABEL[field])}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/profile?edit=1"
          className="px-8 py-3 rounded-[100px] bg-primary-500 hover:bg-primary-500/80 text-white text-[1.4rem] font-medium leading-8 transition-colors"
        >
          {t("cta")}
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="px-6 py-3 rounded-[100px] text-[1.4rem] font-medium leading-8 text-neutral-700 hover:bg-primary-100 transition-colors cursor-pointer"
        >
          {t("later")}
        </button>
      </div>
    </div>
  );
}
