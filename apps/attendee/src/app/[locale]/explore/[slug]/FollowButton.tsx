"use client";
import {
  FollowOrganisationAction,
  UnfollowOrganisationAction,
} from "@/actions/userActions";
import NoAuthDialog from "@/components/Layouts/NoAuthDialog";
import PageLoader from "@/components/PageLoader";
import { ButtonBlack } from "@/components/shared/buttons";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { usePathname } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export default function FollowButton({
  organisationId,
  initialIsFollowing,
}: {
  organisationId: string;
  initialIsFollowing: boolean;
}) {
  const t = useTranslations("Event");
  const locale = useLocale();
  const pathname = usePathname();
  const { data: session } = useSession();
  // Local state so the button reflects the action immediately. The server-side
  // follow-state comes from a cached event payload, so we can't rely on a
  // re-render to flip the label.
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  async function toggle() {
    const token = session?.user?.accessToken;
    if (!token || isLoading) return;

    const next = !isFollowing;
    setIsFollowing(next); // optimistic
    setIsLoading(true);
    const response = next
      ? await FollowOrganisationAction(token, organisationId, pathname, locale)
      : await UnfollowOrganisationAction(
          token,
          organisationId,
          pathname,
          locale,
        );
    setIsLoading(false);

    const ok = "status" in response && response.status === "success";
    if (!ok) {
      setIsFollowing(!next); // revert on failure
      const message =
        ("message" in response && response.message) ||
        ("error" in response && response.error) ||
        "Something went wrong";
      toast.error(message);
    }
  }

  if (!session?.user) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <ButtonBlack>{t("follow")}</ButtonBlack>
        </DialogTrigger>
        <NoAuthDialog callbackUrl={pathname} />
      </Dialog>
    );
  }

  return (
    <>
      <PageLoader isLoading={isLoading} />
      {isFollowing ? (
        <button
          disabled={isLoading}
          onClick={toggle}
          className="py-[7.5px] px-12 rounded-[100px] cursor-pointer border-2 border-black text-[1.4rem] leading-8 text-black disabled:opacity-50"
        >
          {t("unfollow")}
        </button>
      ) : (
        <ButtonBlack disabled={isLoading} onClick={toggle}>
          {t("follow")}
        </ButtonBlack>
      )}
    </>
  );
}
