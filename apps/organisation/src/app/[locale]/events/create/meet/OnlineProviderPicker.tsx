"use client";
import { Link } from "@/i18n/navigation";
import {
  ArrowRight2,
  Icon,
  InfoCircle,
  Video,
  VideoPlay,
} from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import BackButton from "@/components/shared/BackButton";
import TopBar from "@/components/shared/TopBar";
import { ButtonPrimary } from "@/components/shared/buttons";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import PageLoader from "@/components/PageLoader";

export type ZoomStatus = {
  connected: boolean;
  /** False when the environment has no Zoom credentials at all. */
  available: boolean;
  email?: string;
  isLicensed?: boolean;
  seatLimit?: number;
};

/**
 * Google Meet or Zoom, as one step in the online-event flow.
 *
 * Zoom needs a paid plan, because meeting registration — the only way to give
 * each buyer their own revocable join link — is a paid-only feature. That is
 * said here, at the point of choosing, rather than at publish time when the
 * organiser has already filled in three steps of a form.
 */
export default function OnlineProviderPicker({
  code,
  zoom,
}: {
  code: string | undefined;
  zoom: ZoomStatus;
}) {
  const t = useTranslations("Events.create_event.list.online");
  const locale = useLocale();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const organisationId = session?.activeOrganisation?.organisationId;

  /**
   * Send the organiser to Zoom's consent screen.
   *
   * The locale goes along because Zoom returns to one fixed, locale-less URL —
   * `state` is the only thing it echoes back, so it is the only way an
   * organiser working in English does not come back into the French dashboard.
   */
  async function connectZoom() {
    setIsLoading(true);
    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/zoom/${organisationId}/authorize?locale=${locale}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user.accessToken}`,
          },
        },
      );
      const response = await request.json();
      if (response.status === "success") {
        closeRef.current?.click();
        // Leaving the app entirely, so a full navigation rather than the
        // locale-aware router.
        window.location.href = response.authorizationUrl;
      } else {
        toast.error(response.message);
        setIsLoading(false);
      }
    } catch {
      closeRef.current?.click();
      toast.error(t("connectFailed"));
      setIsLoading(false);
    }
  }

  const zoomReady = zoom.connected && zoom.isLicensed;

  return (
    <div className="flex flex-col gap-8">
      <PageLoader isLoading={isLoading} />
      <div className="flex flex-col gap-8">
        <BackButton text={t("back")} />
        <TopBar title={t("title")} />
      </div>
      <ul className="list-3 w-full overflow-y-scroll pb-4">
        <li className={"cursor-pointer"}>
          <ProviderCardLink
            Icon={VideoPlay}
            label={t("googleMeet.title")}
            hint={t("googleMeet.hint")}
            href={`/events/create/meet/categories?code=${code}&provider=google_meet`}
          />
        </li>
        <li className={"cursor-pointer"}>
          {zoomReady ? (
            <ProviderCardLink
              Icon={Video}
              label={t("zoom.title")}
              hint={t("zoom.connectedAs", { email: zoom.email ?? "" })}
              href={`/events/create/meet/categories?provider=zoom`}
            />
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <div>
                  <ProviderCard
                    Icon={Video}
                    label={t("zoom.title")}
                    hint={
                      !zoom.available
                        ? t("zoom.unavailable")
                        : !zoom.connected
                          ? t("zoom.notConnected")
                          : t("zoom.needsPaidPlan")
                    }
                  />
                </div>
              </DialogTrigger>
              <DialogContent className={"w-[360px] lg:w-[520px] "}>
                <DialogHeader>
                  <DialogTitle
                    className={
                      "font-medium border-b border-neutral-100 pb-8  text-[2.6rem] leading-12 text-black font-primary"
                    }
                  >
                    {t("zoom.title")}
                  </DialogTitle>
                  <DialogDescription className={"sr-only"}>
                    <span>{t("zoom.title")}</span>
                  </DialogDescription>
                </DialogHeader>
                <div className="py-8 flex flex-col gap-8 items-center">
                  <div
                    className={
                      "w-[100px] h-[100px] rounded-full flex items-center justify-center bg-neutral-100"
                    }
                  >
                    <div
                      className={
                        "w-[70px] h-[70px] rounded-full flex items-center justify-center bg-neutral-200"
                      }
                    >
                      <InfoCircle size="30" color="#0d0d0d" variant="Bulk" />
                    </div>
                  </div>
                  <p
                    className={`font-sans text-[1.4rem] leading-[25px] text-deep-100 text-center w-[320px] lg:w-full`}
                  >
                    {!zoom.available
                      ? t("zoom.unavailableBody")
                      : !zoom.connected
                        ? t("zoom.warning")
                        : t("zoom.paidPlanBody")}
                  </p>
                </div>
                <DialogFooter>
                  {zoom.available && !zoom.connected && (
                    <ButtonPrimary
                      onClick={connectZoom}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? <LoadingCircleSmall /> : t("zoom.connect")}
                    </ButtonPrimary>
                  )}
                  <DialogClose ref={closeRef} className="sr-only"></DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </li>
      </ul>
    </div>
  );
}

/** The card, matching the category list exactly. */
function ProviderCard({
  Icon,
  label,
  hint,
}: {
  Icon: Icon;
  label: string;
  hint: string;
}) {
  return (
    <div
      className={
        "py-14 px-6 rounded-[10px] bg-neutral-100 hover:bg-primary-50 flex justify-between transition-all duration-500 cursor-pointer group"
      }
    >
      <div className={"flex items-center gap-6"}>
        <Icon
          size="25"
          className=" transition-all duration-500 stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500"
          variant="Bulk"
        />
        <div className={"flex flex-col gap-1"}>
          <span
            className={
              "font-primary font-medium text-[2.2rem] transition-all duration-500 leading-12 text-neutral-900 group-hover:text-primary-500"
            }
          >
            {label}
          </span>
          <span
            className={"font-sans text-[1.4rem] leading-8 text-neutral-600"}
          >
            {hint}
          </span>
        </div>
      </div>
      <div
        className={
          "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 bg-neutral-200 group-hover:bg-primary-100 shrink-0 self-center"
        }
      >
        <ArrowRight2
          size="20"
          className=" transition-all duration-500 stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500"
          variant="Bulk"
        />
      </div>
    </div>
  );
}

function ProviderCardLink({
  href,
  Icon,
  label,
  hint,
}: {
  href: string;
  Icon: Icon;
  label: string;
  hint: string;
}) {
  return (
    <Link href={href}>
      <ProviderCard Icon={Icon} label={label} hint={hint} />
    </Link>
  );
}
