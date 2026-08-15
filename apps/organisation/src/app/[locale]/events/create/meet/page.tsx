import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import { OrganisationPolicy } from "@/lib/role/organisationPolicy";
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import OnlineProviderPicker, {
  GoogleStatus,
  ZoomStatus,
} from "./OnlineProviderPicker";

/**
 * WHICH PLATFORM HOSTS THE CALL.
 *
 * An online event is one activity type with two backends, so this is a step in
 * the existing flow rather than a separate create tree: pick the platform, then
 * carry on through the same category list and the same three-step form. Only
 * the link creation and the way a buyer receives it differ.
 *
 * The Zoom connection is read here rather than in the browser so the card can
 * already say what it is — connect, upgrade, or go — instead of flashing a
 * generic button and correcting itself.
 */
export default async function OnlinePlatformPage({
  searchParams,
}: {
  searchParams: Promise<{ code: string | undefined }>;
}) {
  const { code } = await searchParams;
  const session = await auth();
  const locale = await getLocale();

  const authorized = OrganisationPolicy.fromSession(
    session?.activeOrganisation?.myPermissions ?? [],
  ).createEvent();
  if (!authorized) {
    return <UnauthorizedView />;
  }

  const organisationId = session?.activeOrganisation?.organisationId;

  /**
   * The Ticketwaze plan, which gates Zoom as a Pro+ feature. Read here so the
   * card can show the upgrade path instead of a connect button that would
   * strand a free organiser at publish time.
   */
  const tierRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/me/${organisationId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
        "Accept-Language": locale,
        origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
      },
    },
  );
  const tierResponse = await tierRequest.json().catch(() => null);
  const membershipTier = tierResponse?.membershipTier;
  if (!tierRequest.ok || !membershipTier) {
    return (
      <OrganizerLayout title="OnlinePlatformPage">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }

  /**
   * A Zoom read that fails is reported as "not connected", never as an error
   * page: Google Meet is still a perfectly good answer on this screen, and
   * blocking both platforms because one status call timed out would be worse
   * than offering the one that works.
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

  /**
   * Google's connection state has to come from the API now: the refresh token
   * used to be serialized onto the organisation and read in the browser, which
   * was a credential leak and is no longer sent.
   */
  let googleStatus: GoogleStatus = { connected: false, available: false };
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
      googleStatus = response.google;
    }
  } catch (error) {
    console.error("Failed to read the Google connection status:", error);
  }

  return (
    <OrganizerLayout title="OnlinePlatformPage">
      <OnlineProviderPicker
        code={code}
        zoom={zoom}
        google={googleStatus}
        membershipTier={membershipTier}
      />
    </OrganizerLayout>
  );
}
