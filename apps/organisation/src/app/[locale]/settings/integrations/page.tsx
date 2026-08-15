import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import BackButton from "@/components/shared/BackButton";
import TopBar from "@/components/shared/TopBar";
import { OrganisationPolicy } from "@/lib/role/organisationPolicy";
import { auth } from "@/lib/auth";
import { getLocale, getTranslations } from "next-intl/server";
import ZoomIntegration, { ZoomStatus } from "./ZoomIntegration";
import GoogleIntegration, { GoogleStatus } from "./GoogleIntegration";

/**
 * THE ACCOUNTS THIS ORGANISATION HAS LINKED.
 *
 * Zoom can also be connected inline while creating an event, which is where an
 * organiser actually hits the need — being sent here mid-task to go and set
 * something up would be the wrong shape. This page is the calm version of the
 * same thing, and the only place a connection can be REMOVED: disconnecting is
 * never something an organiser wants to do halfway through creating an event.
 */
export default async function IntegrationsPage() {
  const t = await getTranslations("Settings.integrations");
  const locale = await getLocale();
  const session = await auth();

  // Same permission the connection itself is gated on: linking an account that
  // meetings will be hosted on is part of creating events, not a profile
  // setting anyone on the team can change.
  const authorized = OrganisationPolicy.fromSession(
    session?.activeOrganisation?.myPermissions ?? [],
  ).createEvent();
  if (!authorized) {
    return <UnauthorizedView />;
  }

  const organisationId = session?.activeOrganisation?.organisationId;

  /**
   * A failed read is reported as "not connected" rather than as an error page.
   * The connect button still works, and an organiser who genuinely is connected
   * sees the truth on the next load — which is better than a dead screen.
   */
  let zoom: ZoomStatus = { connected: false, available: false };
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/zoom/${organisationId}/status`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user.accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        cache: "no-store",
      },
    );
    const response = await request.json();
    if (response.status === "success" && response.zoom) {
      zoom = response.zoom;
    }
  } catch (error) {
    console.error("Failed to read the Zoom connection status:", error);
  }

  let google: GoogleStatus = { connected: false, available: false };
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/google/${organisationId}/status`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user.accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        cache: "no-store",
      },
    );
    const response = await request.json();
    if (response.status === "success" && response.google) {
      google = response.google;
    }
  } catch (error) {
    console.error("Failed to read the Google connection status:", error);
  }

  return (
    <OrganizerLayout title={t("title")}>
      <div className="flex flex-col gap-8">
        <BackButton text={t("back")} />
        <TopBar title={t("title")} />
      </div>
      {/*
        The header stays put and this scrolls, matching the other settings
        screens. Without the scroll container the cards simply overflow the
        shell, which has a fixed height — the second one is unreachable.
      */}
      <div
        className={
          "flex flex-col gap-16 w-full lg:w-212 mx-auto overflow-y-scroll overflow-x-hidden h-full"
        }
      >
        <GoogleIntegration google={google} />
        <ZoomIntegration zoom={zoom} />
        <div></div>
      </div>
    </OrganizerLayout>
  );
}
