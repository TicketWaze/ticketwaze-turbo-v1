import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import { OrganisationPolicy } from "@/lib/role/organisationPolicy";
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import CreateEventFlow from "./CreateEventFlow";
import type { OnlineProviders } from "@/components/create/EventLinkCard";
import type {
  GoogleStatus,
  ZoomStatus,
} from "../meet/OnlineProviderPicker";

/**
 * CREATE EVENT — one page for physical and virtual events (Figma › Events ›
 * Create Event). The type is the first field rather than a page before the
 * form, and the category is chosen inside Event Details.
 *
 * Everything the virtual path needs to know about Zoom and Google is read
 * here, so switching Physical ⇄ Virtual never waits on the network.
 */
export default async function CreateEventPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    category?: string;
    provider?: string;
    code?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const locale = await getLocale();
  const authorized = OrganisationPolicy.fromSession(
    session?.activeOrganisation?.myPermissions ?? [],
  ).createEvent();
  if (!authorized) return <UnauthorizedView />;

  const organisationId = session?.activeOrganisation?.organisationId;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.user.accessToken}`,
    "Accept-Language": locale,
    origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
  };

  const meRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/me/${organisationId}`,
    { headers },
  );
  if (meRequest.status === 403) return <UnauthorizedView />;
  const me = await meRequest.json().catch(() => null);
  if (!meRequest.ok || !me?.membershipTier) {
    return (
      <OrganizerLayout title="">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }

  const readStatus = async <T,>(provider: "zoom" | "google"): Promise<T | null> => {
    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${provider}/${organisationId}/status`,
        { headers, cache: "no-store" },
      );
      const response = await request.json();
      return response.status === "success" ? (response[provider] as T) : null;
    } catch {
      return null;
    }
  };
  const [zoom, google] = await Promise.all([
    readStatus<ZoomStatus>("zoom"),
    readStatus<GoogleStatus>("google"),
  ]);

  // Same readiness rules as the platform picker (meet/OnlineProviderPicker).
  const isProLocked = me.membershipTier.membershipName === "free";
  const providers: OnlineProviders = {
    zoom: {
      ready: Boolean(!isProLocked && zoom?.connected && zoom?.isLicensed),
      seatLimit: zoom?.seatLimit ? Number(zoom.seatLimit) : null,
      maxMinutes: zoom?.maxDurationMinutes ? Number(zoom.maxDurationMinutes) : null,
      account: zoom?.email ?? null,
    },
    google_meet: {
      ready: Boolean(google?.connected && google?.plan),
      seatLimit: google?.seatLimit ? Number(google.seatLimit) : null,
      maxMinutes: google?.maxDurationMinutes ? Number(google.maxDurationMinutes) : null,
    },
  };

  const provider =
    params.provider === "zoom" || params.provider === "google_meet" || params.provider === "custom"
      ? params.provider
      : undefined;

  return (
    <OrganizerLayout title="">
      <CreateEventFlow
        initialKind={
          params.type === "virtual" || provider
            ? "virtual"
            : params.type === "physical"
              ? "physical"
              : null
        }
        category={params.category ?? ""}
        provider={provider}
        code={params.code}
        providers={providers}
        membershipTier={me.membershipTier}
        paidTierName={me.paidTierName ?? null}
      />
    </OrganizerLayout>
  );
}
