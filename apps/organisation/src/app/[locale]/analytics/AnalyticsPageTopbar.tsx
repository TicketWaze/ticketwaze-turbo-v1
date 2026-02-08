import { cn } from "@/lib/utils";
import React from "react";
import VerifierOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";
import { MembershipTier } from "@ticketwaze/typescript-config";
import { Crown } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { LinkPrimary } from "@/components/shared/Links";

export default function AnalyticsPageTopbar({
  children,
  title,
  description,
  className,
  isVerified,
  membershipTier,
}: {
  welcome?: boolean;
  className?: string;
  children?: React.ReactNode;
  title: string;
  description?: string;
  notification?: boolean;
  saved?: boolean;
  isVerified: boolean;
  membershipTier: MembershipTier;
}) {
  const t = useTranslations("Analytics");
  return (
    <div className={cn("", className)}>
      <div
        className={
          "flex flex-col gap-[8 items-start lg:flex-row lg:items-center lg:justify-between"
        }
      >
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between w-full">
            <h3
              className={
                "font-medium inline-flex items-center gap-2 font-primary text-[2.6rem] leading-12 text-black"
              }
            >
              {title}
              {isVerified && <VerifierOrganisationCheckMark />}
            </h3>
            {membershipTier.membershipName === "free" && (
              <div className=" p-[2px] rounded-[30px] bg-gradient-to-r from-primary-500 via-[#E752AE] to-[#DD068B]">
                <LinkPrimary
                  className="bg-transparent gap-4 py-2 items-center"
                  href="/settings/subscriptions/upgrade"
                >
                  <Crown
                    size="24"
                    color="#fff"
                    className="hidden lg:block"
                    variant="Bulk"
                  />
                  {t("upgrade")}
                </LinkPrimary>
              </div>
            )}
          </div>
          {description && (
            <h4
              className={
                "text-neutral-600 text-base font-normal font-sans leading-snug text-[16px] mt-2"
              }
            >
              {description}
            </h4>
          )}
        </div>
        <div className={"flex items-center"}>
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
