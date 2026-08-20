"use client";
import { Link } from "@/i18n/navigation";
import { Crown, InfoCircle } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import Image, { StaticImageData } from "next/image";
import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import BackButton from "@/components/shared/BackButton";
import TopBar from "@/components/shared/TopBar";
import { ButtonPrimary } from "@/components/shared/buttons";
import { LinkPrimary } from "@/components/shared/Links";
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
import { MembershipTier } from "@ticketwaze/typescript-config";
import GooglePlanSelect from "@/components/shared/GooglePlanSelect";
import type { GooglePlan } from "@/lib/googleMeetPlans";
import { useRouter } from "@/i18n/navigation";
// Placeholder: both providers share the online cover for now.
import OnlineCover from "@/assets/images/meet.jpg";
import Zoom from "@/assets/images/zoom.webp";
import { meetFlowUrl } from "@/lib/meetFlowLinks";

export type ZoomStatus = {
  connected: boolean;
  /** False when the environment has no Zoom credentials at all. */
  available: boolean;
  email?: string;
  isLicensed?: boolean;
  seatLimit?: number;
  maxDurationMinutes?: number;
};

/**
 * Google Meet or Zoom, as one step in the online-event flow.
 *
 * Two gates sit on the Zoom card and they are different things, which is why
 * they are reported separately rather than collapsed into "unavailable":
 *
 * - The TICKETWAZE plan. Zoom events are Pro+, so a free organiser is shown the
 *   upgrade path, not a connect button that would strand them at publish time.
 * - The ZOOM plan. Per-buyer join links rely on meeting registration, which
 *   Zoom does not offer on Basic.
 *
 * Said here, at the point of choosing, rather than at publish time when the
 * organiser has already filled in three steps of a form.
 */
export type GoogleStatus = {
  connected: boolean;
  /** False when the environment has no Google credentials at all. */
  available: boolean;
  /**
   * The plan the organiser declared, or null when they have not yet.
   *
   * Google reports no capacity or edition to the scopes we hold, so this is the
   * only source of the Meet seat cap and duration ceiling. Connected-without-a-
   * plan is a real state — every organisation connected before plans existed is
   * in it — and the card asks rather than walking them into a form the API will
   * refuse at submit.
   */
  plan?: GooglePlan | null;
  seatLimit?: number | null;
  maxDurationMinutes?: number | null;
};

export default function OnlineProviderPicker({
  code,
  zoom,
  google,
  membershipTier,
}: {
  code: string | undefined;
  zoom: ZoomStatus;
  google: GoogleStatus;
  membershipTier: MembershipTier;
}) {
  const t = useTranslations("Events.create_event.list.online");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [googlePlan, setGooglePlan] = useState<GooglePlan | null>(
    google.plan ?? null,
  );

  const organisationId = session?.activeOrganisation?.organisationId;

  /**
   * Pro+, with a trial counting — the same rule raffles and private events
   * use. A trial exists to show the paid features off.
   */
  const isProLocked = membershipTier.membershipName === "free";

  /**
   * Send the organiser to Zoom's consent screen.
   *
   * The locale and origin go along because Zoom returns to one fixed,
   * locale-less URL — `state` is the only thing it echoes back, so it is the
   * only way an organiser comes back to the right language and the right place.
   */
  async function connectZoom() {
    setIsLoading(true);
    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/zoom/${organisationId}/authorize?locale=${locale}&origin=create`,
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

  /**
   * Google Meet is on every Ticketwaze plan, but two things gate the card: the
   * connection, and the declared Google plan the seat and duration limits are
   * read from. Both have to be answered before the form is worth opening.
   */
  const googleReady = google.connected && Boolean(google.plan);

  /** Store the declared plan. Shared by the connect path and the declare path. */
  async function saveGooglePlan(next: GooglePlan): Promise<boolean> {
    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/google/${organisationId}/plan`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user.accessToken}`,
          },
          body: JSON.stringify({ plan: next }),
        },
      );
      const response = await request.json();
      if (response.status === "success") return true;
      toast.error(response.message ?? t("googleMeet.planFailed"));
      return false;
    } catch {
      toast.error(t("googleMeet.planFailed"));
      return false;
    }
  }

  /**
   * Already connected, just never asked. Declares the plan and carries straight
   * on into the category list, so an organisation that connected before plans
   * existed answers one question instead of being sent to settings mid-task.
   */
  async function declareGooglePlanAndContinue() {
    if (!googlePlan) {
      toast.error(t("googleMeet.planRequired"));
      return;
    }
    setIsLoading(true);
    if (!(await saveGooglePlan(googlePlan))) {
      setIsLoading(false);
      return;
    }
    closeRef.current?.click();
    router.push(
      meetFlowUrl("/events/create/meet/categories", {
        code,
        provider: "google_meet",
      }),
    );
  }

  /** Send the organiser to Google's consent screen, plan declared first. */
  async function connectGoogle() {
    if (!googlePlan) {
      toast.error(t("googleMeet.planRequired"));
      return;
    }
    setIsLoading(true);
    /**
     * Declared BEFORE leaving for Google, because after the redirect this
     * component is gone and the answer with it. A plan stored against a connect
     * the organiser then abandons is still true about their account.
     */
    if (!(await saveGooglePlan(googlePlan))) {
      setIsLoading(false);
      return;
    }
    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/google/${organisationId}/authorize?locale=${locale}&origin=create`,
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
        window.location.href = response.authorizationUrl;
      } else {
        toast.error(response.message);
        setIsLoading(false);
      }
    } catch {
      closeRef.current?.click();
      toast.error(t("googleMeet.connectFailed"));
      setIsLoading(false);
    }
  }

  const zoomReady = !isProLocked && zoom.connected && zoom.isLicensed;

  /**
   * The blocking reason, in the order the organiser can act on them: upgrade
   * Ticketwaze, then make Zoom reachable, then connect, then upgrade Zoom.
   */
  const zoomBlocker = isProLocked
    ? "plan"
    : !zoom.available
      ? "unavailable"
      : !zoom.connected
        ? "notConnected"
        : "needsPaidPlan";

  return (
    <div className="flex flex-col gap-8 overflow-y-scroll">
      <PageLoader isLoading={isLoading} />
      <div className="flex flex-col gap-8">
        <BackButton text={t("back")} />
        <TopBar title={t("title")} />
      </div>
      <ul className="list overflow-y-scroll py-2 px-2">
        <li>
          {googleReady ? (
            <Link
              href={meetFlowUrl("/events/create/meet/categories", {
                code,
                provider: "google_meet",
              })}
              className="block relative cursor-pointer group"
            >
              <ProviderCard
                title={t("googleMeet.title")}
                description={t("googleMeet.hint")}
              />
            </Link>
          ) : (
            /**
             * Either not connected, or connected with no plan declared. Both
             * ask a question here rather than walking the organiser into a form
             * that would be refused on submit — the connection is stored when
             * they come back from Google, and the plan is what the seat and
             * duration limits are read from.
             */
            <Dialog>
              <DialogTrigger asChild>
                <div className="block relative cursor-pointer group">
                  <ProviderCard
                    title={t("googleMeet.title")}
                    description={
                      !google.available
                        ? t("googleMeet.unavailable")
                        : google.connected
                          ? t("googleMeet.planNeeded")
                          : t("googleMeet.notConnected")
                    }
                  />
                </div>
              </DialogTrigger>
              {/*
                Capped and scrolled INSIDE, not grown.
                The plan picker added a paragraph and a select to a dialog that
                had no height limit, so on a short window it ran off the bottom
                of the screen and took the Connect button with it. The title and
                the footer stay put; only the body between them moves.
              */}
              <DialogContent
                className={
                  "w-[360px] lg:w-[520px] max-h-[85vh] grid-rows-[auto_1fr_auto] overflow-hidden"
                }
              >
                <DialogHeader>
                  <DialogTitle
                    className={
                      "font-medium border-b border-neutral-100 pb-8 text-[2.6rem] leading-12 text-black font-primary"
                    }
                  >
                    {t("googleMeet.title")}
                  </DialogTitle>
                  <DialogDescription className={"sr-only"}>
                    <span>{t("googleMeet.title")}</span>
                  </DialogDescription>
                </DialogHeader>
                {/* min-h-0 is what lets a grid row shrink below its content
                    and actually scroll, rather than pushing the dialog taller. */}
                <div className="py-8 flex flex-col gap-8 items-center overflow-y-auto min-h-0">
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
                    {!google.available
                      ? t("googleMeet.unavailableBody")
                      : google.connected
                        ? t("googleMeet.planBody")
                        : t("googleMeet.warning")}
                  </p>
                  {/*
                    Asked in both states, because Google tells us neither the
                    participant capacity nor the edition and this is the only
                    place the answer can come from. Shown with each plan's
                    limits beside it: an organiser who does not know a free
                    Gmail cuts group calls at 60 minutes would otherwise pick
                    the right plan and still schedule a three-hour event.
                  */}
                  {google.available && (
                    <div className="w-full">
                      <GooglePlanSelect
                        value={googlePlan}
                        onChange={setGooglePlan}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  {google.available && (
                    <ButtonPrimary
                      onClick={
                        google.connected
                          ? declareGooglePlanAndContinue
                          : connectGoogle
                      }
                      disabled={isLoading || !googlePlan}
                      className="w-full"
                    >
                      {isLoading ? (
                        <LoadingCircleSmall />
                      ) : google.connected ? (
                        t("googleMeet.planContinue")
                      ) : (
                        t("googleMeet.connect")
                      )}
                    </ButtonPrimary>
                  )}
                  <DialogClose ref={closeRef} className="sr-only"></DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </li>
        <li>
          {zoomReady ? (
            <Link
              href={`/events/create/meet/categories?provider=zoom`}
              className="block relative cursor-pointer group"
            >
              <ProviderCard
                title={t("zoom.title")}
                description={
                  // Zoom can report a connection whose account read failed, and
                  // "Connected as ." is worse than saying nothing about who.
                  zoom.email
                    ? t("zoom.connectedAs", { email: zoom.email })
                    : t("zoom.connectedGeneric")
                }
                image={Zoom}
              />
            </Link>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <div className="block relative cursor-pointer group">
                  <ProviderCard
                    title={t("zoom.title")}
                    description={t(`zoom.${zoomBlocker}`)}
                    image={Zoom}
                  />
                </div>
              </DialogTrigger>
              <DialogContent className={"w-[360px] lg:w-[520px] "}>
                <DialogHeader>
                  <DialogTitle
                    className={
                      "font-medium border-b border-neutral-100 pb-8 text-[2.6rem] leading-12 text-black font-primary"
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
                      {isProLocked ? (
                        <Crown size="30" color="#0d0d0d" variant="Bulk" />
                      ) : (
                        <InfoCircle size="30" color="#0d0d0d" variant="Bulk" />
                      )}
                    </div>
                  </div>
                  <p
                    className={`font-sans text-[1.4rem] leading-[25px] text-deep-100 text-center w-[320px] lg:w-full`}
                  >
                    {isProLocked
                      ? t("zoom.proFeature")
                      : zoomBlocker === "unavailable"
                        ? t("zoom.unavailableBody")
                        : zoomBlocker === "notConnected"
                          ? t("zoom.warning")
                          : t("zoom.paidPlanBody")}
                  </p>
                </div>
                <DialogFooter>
                  {isProLocked ? (
                    <div className="flex-1 p-[2px] rounded-[30px] bg-gradient-to-r from-primary-500 via-[#E752AE] to-[#DD068B]">
                      <LinkPrimary
                        className="bg-transparent gap-4 py-2 items-center"
                        href="/settings/subscriptions/upgrade"
                      >
                        <Crown size="24" color="#fff" variant="Bulk" />
                        {t("upgrade")}
                      </LinkPrimary>
                    </div>
                  ) : (
                    zoomBlocker === "notConnected" && (
                      <ButtonPrimary
                        onClick={connectZoom}
                        disabled={isLoading}
                        className="w-full"
                      >
                        {isLoading ? <LoadingCircleSmall /> : t("zoom.connect")}
                      </ButtonPrimary>
                    )
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

/**
 * The activity-type card, reused verbatim from the create list so the two
 * screens read as one flow rather than two designs.
 */
function ProviderCard({
  title,
  description,
  image = OnlineCover,
}: {
  title: string;
  description: string;
  image?: StaticImageData;
}) {
  return (
    <div
      className={`h-[165px] lg:h-[280px] rounded-2xl overflow-hidden relative transition-all duration-300`}
    >
      <Image
        src={image}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        width={255}
        height={191}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/10" />
      <div className="absolute bottom-8 left-4 right-4 text-white z-10 flex flex-col gap-2">
        <h3 className="text-[2.6rem] font-primary leading-[30px] font-bold">
          {title}
        </h3>
        <p className="text-[1.5rem] text-neutral-300">{description}</p>
      </div>
    </div>
  );
}
