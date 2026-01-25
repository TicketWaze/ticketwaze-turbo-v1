import { cn } from "@/lib/utils";
import React from "react";
import VerifierOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";

export default function AnalyticsPageTopbar({
  children,
  title,
  description,
  className,
  isVerified,
}: {
  welcome?: boolean;
  className?: string;
  children?: React.ReactNode;
  title: string;
  description?: string;
  notification?: boolean;
  saved?: boolean;
  isVerified: boolean;
}) {
  return (
    <div className={cn("", className)}>
      <div
        className={
          "flex flex-col gap-[8 items-start lg:flex-row lg:items-center lg:justify-between"
        }
      >
        <div className="flex flex-col">
          <h3
            className={
              "font-medium inline-flex items-center gap-2 font-primary text-[2.6rem] leading-12 text-black"
            }
          >
            {title}
            {isVerified && <VerifierOrganisationCheckMark />}
          </h3>
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
