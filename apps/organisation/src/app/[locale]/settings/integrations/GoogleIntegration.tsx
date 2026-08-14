"use client";
import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Google, InfoCircle, TickCircle } from "iconsax-reactjs";
import { ButtonPrimary, ButtonRed } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import PageLoader from "@/components/PageLoader";
import GooglePlanSelect, {
  formatDuration,
} from "@/components/shared/GooglePlanSelect";
import type { GooglePlan } from "@/lib/googleMeetPlans";
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

export type GoogleStatus = {
  connected: boolean;
  /** False when the environment has no Google credentials at all. */
  available: boolean;
  /** The declared plan, or null when the organiser has not said yet. */
  plan?: GooglePlan | null;
  /** Tickets this plan can cover, host's own place excluded. Null if undeclared. */
  seatLimit?: number | null;
  /** Longest a group call may run on it. Null if undeclared. */
  maxDurationMinutes?: number | null;
};

/**
 * Connect, inspect and disconnect the organisation's Google account.
 *
 * **Reconnect is the point of this card.** A Google refresh token can be
 * revoked or expire, and until this existed there was nowhere to authorise
 * again: the connection still looked healthy because the token was present, so
 * the create flow linked straight past the Connect button and failed at submit.
 * Connecting again is offered here whether or not we think we are connected.
 *
 * **The plan is the second thing it exists for.** Google reports neither
 * participant capacity nor edition to the scopes we hold, so what an organiser
 * says here is the only source of the seat cap and the duration ceiling that
 * Meet events are checked against. It is editable while connected because a
 * Workspace plan can change, and correcting it must not mean tearing down a
 * working connection.
 */
export default function GoogleIntegration({
  google,
}: {
  google: GoogleStatus;
}) {
  const t = useTranslations("Settings.integrations.google");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [plan, setPlan] = useState<GooglePlan | null>(google.plan ?? null);

  const organisationId = session?.activeOrganisation?.organisationId;

  /**
   * Store the declaration.
   *
   * Called on its own from the "save plan" button, and again just before
   * connecting: a declaration made and then abandoned at Google's consent
   * screen is still true about the account, and asking twice for the same
   * answer would be worse than keeping it.
   */
  async function savePlan(next: GooglePlan): Promise<boolean> {
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
      toast.error(response.message ?? t("planFailed"));
      return false;
    } catch {
      toast.error(t("planFailed"));
      return false;
    }
  }

  async function onSavePlan() {
    if (!plan) return;
    setIsLoading(true);
    if (await savePlan(plan)) {
      toast.success(t("planSaved"));
      router.refresh();
    }
    setIsLoading(false);
  }

  async function connect() {
    /**
     * The plan goes first, so an organiser who completes the Google consent
     * screen comes back with everything needed to create an event. Refused
     * rather than defaulted when unanswered: a guess here oversells or
     * needlessly blocks, and only they know the answer.
     */
    if (!plan) {
      toast.error(t("planRequired"));
      return;
    }
    setIsLoading(true);
    if (!(await savePlan(plan))) {
      setIsLoading(false);
      return;
    }
    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/google/${organisationId}/authorize?locale=${locale}&origin=settings`,
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
        window.location.href = response.authorizationUrl;
      } else {
        toast.error(response.message);
        setIsLoading(false);
      }
    } catch {
      toast.error(t("connectFailed"));
      setIsLoading(false);
    }
  }

  async function disconnect() {
    setIsLoading(true);
    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/google/${organisationId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user.accessToken}`,
          },
        },
      );
      const response = await request.json();
      closeRef.current?.click();
      if (response.status === "success") {
        toast.success(t("disconnected"));
        router.refresh();
      } else {
        toast.error(response.message ?? t("disconnectFailed"));
      }
    } catch {
      closeRef.current?.click();
      toast.error(t("disconnectFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageLoader isLoading={isLoading} />
      <div className="rounded-[10px] bg-neutral-100 p-8 flex flex-col gap-8">
        <div className="flex items-center gap-6">
          <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center bg-neutral-200 shrink-0">
            <Google size="30" color="#0d0d0d" variant="Bulk" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-primary font-medium text-[2.2rem] leading-12 text-neutral-900">
              {t("title")}
            </span>
            <span className="font-sans text-[1.4rem] leading-8 text-neutral-600">
              {t("description")}
            </span>
          </div>
        </div>

        {!google.available ? (
          <StatusNote tone="info" text={t("unavailable")} />
        ) : !google.connected ? (
          <>
            <StatusNote tone="info" text={t("notConnected")} />
            <PlanField
              plan={plan}
              onChange={setPlan}
              disabled={isLoading}
              label={t("planLabel")}
              hint={t("planHint")}
            />
            <ButtonPrimary
              onClick={connect}
              disabled={isLoading}
              className="w-full lg:w-fit"
            >
              {isLoading ? <LoadingCircleSmall /> : t("connect")}
            </ButtonPrimary>
          </>
        ) : (
          <>
            <StatusNote tone="ok" text={t("connected")} />
            {/*
              Shown while connected, and editable, because a Workspace plan can
              change and because organisations that connected before this
              existed have nothing declared at all. An undeclared plan is
              called out rather than left blank: creating a Meet event will
              refuse until it is answered, and this is where it gets answered.
            */}
            {google.plan && google.seatLimit && google.maxDurationMinutes ? (
              <StatusNote
                tone="ok"
                text={t("planCurrent", {
                  name: t(`plans.${google.plan}`),
                  seats: google.seatLimit,
                  duration: formatDuration(google.maxDurationMinutes, (k, v) =>
                    t(`plans.${k}`, v),
                  ),
                })}
              />
            ) : (
              <StatusNote tone="info" text={t("planMissing")} />
            )}
            <PlanField
              plan={plan}
              onChange={setPlan}
              disabled={isLoading}
              label={t("planLabel")}
              hint={t("planHint")}
            />
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <ButtonPrimary
                onClick={onSavePlan}
                disabled={isLoading || !plan || plan === google.plan}
                className="w-full lg:w-fit"
              >
                {isLoading ? <LoadingCircleSmall /> : t("planSave")}
              </ButtonPrimary>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/*
                Offered even while connected. A revoked or expired token still
                reads as connected here, and re-authorising is the only fix —
                so the way out must not be hidden behind looking healthy.
              */}
              <ButtonPrimary
                onClick={connect}
                disabled={isLoading}
                className="w-full lg:w-fit"
              >
                {isLoading ? <LoadingCircleSmall /> : t("reconnect")}
              </ButtonPrimary>
              <Dialog>
                <DialogTrigger asChild>
                  <ButtonRed disabled={isLoading} className="w-full lg:w-fit">
                    {t("disconnect")}
                  </ButtonRed>
                </DialogTrigger>
                <DialogContent className={"w-[360px] lg:w-[520px]"}>
                  <DialogHeader>
                    <DialogTitle
                      className={
                        "font-medium border-b border-neutral-100 pb-8 text-[2.6rem] leading-12 text-black font-primary"
                      }
                    >
                      {t("disconnect")}
                    </DialogTitle>
                    <DialogDescription className={"sr-only"}>
                      <span>{t("disconnect")}</span>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-8 flex flex-col gap-8 items-center">
                    <div className="w-[100px] h-[100px] rounded-full flex items-center justify-center bg-neutral-100">
                      <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center bg-neutral-200">
                        <InfoCircle size="30" color="#0d0d0d" variant="Bulk" />
                      </div>
                    </div>
                    <p
                      className={
                        "font-sans text-[1.4rem] leading-[25px] text-deep-100 text-center w-[320px] lg:w-full"
                      }
                    >
                      {t("disconnectWarning")}
                    </p>
                  </div>
                  <DialogFooter>
                    <ButtonRed
                      onClick={disconnect}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? <LoadingCircleSmall /> : t("disconnect")}
                    </ButtonRed>
                    <DialogClose ref={closeRef} className="sr-only" />
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * The plan question, labelled and explained.
 *
 * The hint carries the part organisers do not know: that we cannot read this
 * from Google, and that it is what decides how many tickets they can sell and
 * how long the call can run. Without that, a dropdown asking for a plan looks
 * like optional profile trivia and gets whatever is first in the list.
 */
function PlanField({
  plan,
  onChange,
  disabled,
  label,
  hint,
}: {
  plan: GooglePlan | null;
  onChange: (plan: GooglePlan) => void;
  disabled: boolean;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <span className="font-sans font-medium text-[1.5rem] leading-8 text-neutral-900">
        {label}
      </span>
      <span className="font-sans text-[1.4rem] leading-8 text-neutral-600">
        {hint}
      </span>
      <div className="w-full lg:w-[420px]">
        <GooglePlanSelect
          value={plan}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function StatusNote({ tone, text }: { tone: "ok" | "info"; text: string }) {
  return (
    <div className="flex items-start gap-4">
      {tone === "ok" ? (
        <TickCircle
          size="20"
          color="#16a34a"
          variant="Bulk"
          className="shrink-0 mt-1"
        />
      ) : (
        <InfoCircle
          size="20"
          color="#737c8a"
          variant="Bulk"
          className="shrink-0 mt-1"
        />
      )}
      <span className="font-sans text-[1.4rem] leading-8 text-neutral-700">
        {text}
      </span>
    </div>
  );
}
