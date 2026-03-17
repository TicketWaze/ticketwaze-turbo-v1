"use client";
import { UnfollowOrganisationAction } from "@/actions/userActions";
import PageLoader from "@/components/PageLoader";
import { usePathname } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export default function Unfollow({
  organisationId,
}: {
  organisationId: string;
}) {
  const t = useTranslations("Event");
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  async function FollowOrganisation() {
    setIsLoading(true);
    const response = await UnfollowOrganisationAction(
      session?.user?.accessToken as string,
      organisationId,
      pathname,
      locale,
    );
    if (response.error) {
      toast.error(response.message);
    }
    setIsLoading(false);
  }
  return (
    <>
      {isLoading && <PageLoader isLoading={isLoading} />}
      <button
        className="py-[7.5px] px-12 rounded-[100px] cursor-pointer border-2 border-black text-[1.4rem] leading-8 text-black "
        onClick={FollowOrganisation}
      >
        {t("unfollow")}
      </button>
    </>
  );
}
