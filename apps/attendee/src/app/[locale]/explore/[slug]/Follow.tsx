"use client";
import { FollowOrganisationAction } from "@/actions/userActions";
import NoAuthDialog from "@/components/Layouts/NoAuthDialog";
import PageLoader from "@/components/PageLoader";
import { ButtonBlack } from "@/components/shared/buttons";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { usePathname } from "@/i18n/navigation";
import { User } from "@ticketwaze/typescript-config";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export default function Follow({
  user,
  organisationId,
}: {
  user: User;
  organisationId: string;
}) {
  const t = useTranslations("Event");
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  async function FollowOrganisation() {
    setIsLoading(true);
    const response = await FollowOrganisationAction(
      user.accessToken,
      organisationId,
      pathname,
      locale,
    );
    if (response.error) {
      toast.error(response.message);
    }
    setIsLoading(false);
  }
  const { data: session } = useSession();
  return (
    <>
      {isLoading && <PageLoader isLoading={isLoading} />}
      {session?.user ? (
        <ButtonBlack onClick={FollowOrganisation}>{t("follow")}</ButtonBlack>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <ButtonBlack>{t("follow")}</ButtonBlack>
          </DialogTrigger>
          <NoAuthDialog />
        </Dialog>
      )}
    </>
  );
}
