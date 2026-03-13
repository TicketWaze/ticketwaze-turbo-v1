"use client";
import { UpdateUserPreferences } from "@/actions/userActions";
import PageLoader from "@/components/PageLoader";
import Separator from "@/components/shared/Separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserPreference } from "@ticketwaze/typescript-config";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export default function UserPreferences({
  userPreferences,
}: {
  userPreferences: UserPreference;
}) {
  const t = useTranslations("Preferences.user");
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const locale = useLocale();

  async function updateCurrency(currency: string) {
    setIsLoading(true);
    const response = await UpdateUserPreferences(
      session?.user.accessToken ?? "",
      {
        ...userPreferences,
        currency,
      },
      locale,
    );
    if (response.status !== "success") {
      toast.error(response.message);
    }
    await update({
      ...session,
      user: {
        ...session?.user,
        userPreference: {
          ...session?.user.userPreference,
          currency,
        },
      },
    });
    setIsLoading(false);
  }
  async function updateNotification(notifications: string) {
    setIsLoading(true);
    const response = await UpdateUserPreferences(
      session?.user.accessToken ?? "",
      {
        ...userPreferences,
        notifications,
      },
      locale,
    );
    if (response.status !== "success") {
      toast.error(response.message);
    }
    setIsLoading(false);
  }
  return (
    <>
      <PageLoader isLoading={isLoading} />
      <form className="flex flex-col gap-[4rem]">
        <div className="flex flex-col gap-6">
          <span className="font-medium text-[1.8rem] mb-4 leading-[25px] text-deep-100">
            {t("currency")}
          </span>
          <RadioGroup
            defaultValue={userPreferences.currency}
            onValueChange={(e) => updateCurrency(e)}
            className="flex flex-col gap-6 w-full justify-between lg:justify-around"
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className={
                  "text-[1.6rem] leading-[22px] text-deep-100 max-w-[280px] lg:max-w-[380px]"
                }
              >
                Gourdes
              </span>
              <RadioGroupItem value={"HTG"} />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <span
                className={
                  "text-[1.6rem] leading-[22px] text-deep-100 max-w-[280px] lg:max-w-[380px]"
                }
              >
                Dollard US
              </span>
              <RadioGroupItem value={"USD"} />
            </div>
          </RadioGroup>
        </div>
        <div className="flex flex-col gap-6">
          <span className="font-medium text-[1.8rem] mb-4 leading-[25px] text-deep-100">
            {t("notifications")}
          </span>
          <RadioGroup
            defaultValue={userPreferences.notifications}
            onValueChange={(e) => updateNotification(e)}
            className="flex flex-col gap-6 w-full justify-between"
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className={
                  "text-[1.6rem] leading-[22px] text-deep-100 max-w-[280px] lg:max-w-[380px]"
                }
              >
                Email
              </span>
              <RadioGroupItem value={"email"} />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <span
                className={
                  "text-[1.6rem] leading-[22px] text-deep-100 max-w-[280px] lg:max-w-[380px]"
                }
              >
                Whatsapp
              </span>
              <RadioGroupItem value={"whatsapp"} />
            </div>
          </RadioGroup>
        </div>
      </form>
    </>
  );
}
