"use client";
import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { InfoCircle, TickCircle, Video } from "iconsax-reactjs";
import { ButtonPrimary, ButtonRed } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import PageLoader from "@/components/PageLoader";
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

export type ZoomStatus = {
  connected: boolean;
  /** False when the environment has no Zoom credentials at all. */
  available: boolean;
  email?: string;
  isLicensed?: boolean;
  seatLimit?: number;
};

/**
 * Connect, inspect and disconnect the organisation's Zoom account.
 *
 * The plan level is shown rather than merely enforced: an organiser on a free
 * Zoom account needs to know why Zoom events are refused BEFORE they build one,
 * and the seat count is the number their ticket quantities will be capped at.
 */
export default function ZoomIntegration({ zoom }: { zoom: ZoomStatus }) {
  const t = useTranslations("Settings.integrations.zoom");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const organisationId = session?.activeOrganisation?.organisationId;

  async function connect() {
    setIsLoading(true);
    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/zoom/${organisationId}/authorize?locale=${locale}&origin=settings`,
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
        // Leaving the app entirely, so a full navigation rather than the
        // locale-aware router.
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
        `${process.env.NEXT_PUBLIC_API_URL}/events/zoom/${organisationId}`,
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
            <Video size="30" color="#0d0d0d" variant="Bulk" />
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

        {!zoom.available ? (
          <StatusNote tone="info" text={t("unavailable")} />
        ) : !zoom.connected ? (
          <>
            <StatusNote tone="info" text={t("notConnected")} />
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
            <StatusNote
              tone={zoom.isLicensed ? "ok" : "info"}
              text={
                zoom.isLicensed
                  ? t("connectedAs", {
                      email: zoom.email ?? "",
                      seats: zoom.seatLimit ?? 0,
                    })
                  : t("connectedButFree", { email: zoom.email ?? "" })
              }
            />
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/*
                Offered even while connected, for the same reason as Google's:
                a connection whose tokens have gone stale still reports as
                connected, and re-authorising is the only fix. Hiding it behind
                looking healthy is what makes a stale connection unescapable.
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
