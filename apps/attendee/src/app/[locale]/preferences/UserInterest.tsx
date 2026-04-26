"use client";

import PageLoader from "@/components/PageLoader";
import { ButtonPrimary } from "@/components/shared/buttons";
import { UserPreference } from "@ticketwaze/typescript-config";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useLocale, useTranslations } from "use-intl";
import { toast } from "sonner";
import { UpdateUserPreferences } from "@/actions/userActions";

interface OnboardingData {
  interests: string[]; // step 1
}

export default function UserInterest({
  userPreferences,
}: {
  userPreferences: UserPreference;
}) {
  const t = useTranslations("Preferences");
  const locale = useLocale();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    interests: userPreferences.interests,
  });
  const interestList = [
    { title: t("interests.second.musics"), value: "musics" },
    { title: t("interests.second.theater"), value: "theater" },
    { title: t("interests.second.arts"), value: "arts" },
    { title: t("interests.second.sports"), value: "sports" },
    { title: t("interests.second.business"), value: "business" },
    { title: t("interests.second.networking"), value: "networking" },
    { title: t("interests.second.online"), value: "online" },
    { title: t("interests.second.rentals"), value: "rentals" },
    { title: t("interests.second.transport"), value: "transport" },
    { title: t("interests.second.booking"), value: "booking" },
  ];
  function toggleInterest(value: string) {
    setData((prev) => ({
      ...prev,
      interests: prev.interests.includes(value)
        ? prev.interests.filter((i) => i !== value)
        : [...prev.interests, value],
    }));
    // clear error as soon as user picks something
    // if (errors.interests) setErrors((e) => ({ ...e, interests: undefined }));
  }

  async function submitHandler() {
    if (data.interests.length < 1) {
      toast.error(t("interests.error"));
      return;
    }
    setIsLoading(true);
    const response = await UpdateUserPreferences(
      session?.user.accessToken ?? "",
      {
        ...userPreferences,
        interests: data.interests,
      },
      locale,
    );
    if (response.status === "failed") {
      toast.error(response.message);
    }
    setIsLoading(false);
  }
  return (
    <div className="flex flex-col gap-6">
      <PageLoader isLoading={isLoading} />
      <span className="font-medium text-[1.8rem] mb-4 leading-10 text-deep-100">
        {t("interests.title")}
      </span>
      <ul className="flex gap-6 flex-wrap">
        {interestList.map((interest) => (
          <li key={interest.value}>
            <button
              type="button"
              onClick={() => toggleInterest(interest.value)}
              className={`border px-4 py-4 rounded-[9px] text-[1.6rem] text-deep-100 leading-[2.2rem] cursor-pointer transition-all duration-300 ${
                data.interests.includes(interest.value)
                  ? "border-primary-500 bg-primary-50 text-primary-600"
                  : "border-neutral-100 hover:border-neutral-300"
              }`}
            >
              {interest.title}
            </button>
          </li>
        ))}
      </ul>
      <ButtonPrimary onClick={submitHandler}>
        {t("interests.update")}
      </ButtonPrimary>
    </div>
  );
}
