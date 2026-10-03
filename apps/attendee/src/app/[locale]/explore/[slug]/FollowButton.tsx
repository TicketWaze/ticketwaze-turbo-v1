"use client";
import {
  FollowOrganisationAction,
  UnfollowOrganisationAction,
} from "@/actions/userActions";
import NoAuthDialog from "@/components/Layouts/NoAuthDialog";
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
  onChange,
}: {
  organisationId: string;
  initialIsFollowing: boolean;
  /** Told once the server has confirmed a follow / unfollow. */
  onChange?: (isFollowing: boolean) => void;
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
    if (ok) {
      onChange?.(next);
    } else {
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
        <NoAuthDialog callbackUrl={pathname} intent="follow" />
      </Dialog>
    );
  }

  // Flips in place (optimistic) instead of blocking the page with a loader.
  return isFollowing ? (
    <button
      disabled={isLoading}
      onClick={toggle}
      aria-pressed
      className="py-[7.5px] px-12 rounded-[100px] cursor-pointer border-2 border-black text-[1.4rem] leading-8 text-black transition-transform active:scale-95 disabled:cursor-wait"
    >
      {t("unfollow")}
    </button>
  ) : (
    <ButtonBlack
      disabled={isLoading}
      onClick={toggle}
      aria-pressed={false}
      className="transition-transform active:scale-95 disabled:cursor-wait"
    >
      {t("follow")}
    </ButtonBlack>
  );
}
