import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { Ticket } from "iconsax-reactjs";
import ContactInfo from "@/components/activity/ContactInfo";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import OrganizerActions from "./OrganizerActions";
import { Event } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import Separator from "@/components/shared/Separator";
import EventCard from "@/components/shared/EventCard";
import VerifiedOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";
import ShareEvent from "@/components/shared/ShareEvent";
import { getOrganisation } from "@/lib/getOrganisation";
import { slugify } from "@/lib/Slugify";
import StripHtml from "@/lib/StripHtml";
import {
  JsonLd,
  buildOrganisationJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/structuredData";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import SignedOutState from "@/components/SignedOutState";

/** Preview text for search results and link unfurls. */
function previewDescription(organisation: {
  organisationName: string;
  organisationDescription?: string | null;
  city?: string | null;
  country?: string | null;
}): string {
  const described = StripHtml(
    organisation.organisationDescription ?? "",
  ).trim();
  if (described) return described.slice(0, 200);
  // A blank description would unfurl as a bare title, so fall back to
  // something factual rather than nothing.
  const place = [organisation.city, organisation.country]
    .filter(Boolean)
    .join(", ");
  return place
    ? `${organisation.organisationName} — events in ${place}, on Ticketwaze.`
    : `${organisation.organisationName} on Ticketwaze.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const organisation = await getOrganisation(slug);

  if (!organisation) {
    return { title: "Organisation not found", robots: { index: false } };
  }

  const description = previewDescription(organisation);
  const canonicalSlug = slugify(
    organisation.organisationName,
    organisation.organisationId,
  );
  const path = `/${locale}/organisations/${canonicalSlug}`;

  return {
    title: organisation.organisationName,
    description,
    /**
     * The slug is decorative — every spelling of the name resolves to the same
     * organisation, so without a canonical every rename spawns a duplicate URL
     * competing with itself in search results.
     */
    alternates: { canonical: path },
    openGraph: {
      title: organisation.organisationName,
      description,
      // "profile" is the honest type for an entity page; WhatsApp and Facebook
      // both render it with the same large card as "website".
      type: "profile",
      url: path,
      siteName: "Ticketwaze",
      locale,
      /**
       * No `images` here on purpose. The sibling `opengraph-image.tsx` route
       * supplies it, and Next gives that file precedence — declaring both means
       * maintaining two sources for one tag.
       */
    },
    twitter: {
      card: "summary_large_image",
      title: organisation.organisationName,
      description,
    },
    // Only signed-in users see the page, so keep it out of search results.
    // The Open Graph tags above still give shared links a proper preview.
    robots: { index: false, follow: false },
  };
}

export default async function OrganizerProfile({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const t = await getTranslations("Organizers");
  // Organisation pages are for account holders only; come back here after
  // signing in.
  const session = await auth();
  if (!session?.user) {
    return (
      <AttendeeLayout title={t("title")}>
        <SignedOutState
          page="organisations"
          title={t("title")}
          returnPath={`/organisations/${slug}`}
        />
      </AttendeeLayout>
    );
  }
  // Same call generateMetadata made — Next dedupes it into one request.
  const organisation = await getOrganisation(slug);
  if (!organisation) {
    notFound();
  }

  const events: Event[] = organisation.events ?? [];
  const upcomingEvents: Event[] = organisation.upcomingEvents ?? [];
  const pastEvents: Event[] = events.filter(
    (event) =>
      !upcomingEvents.some((upcoming) => upcoming.eventId === event.eventId),
  );

  const canonicalPath = `/${locale}/organisations/${slugify(
    organisation.organisationName,
    organisation.organisationId,
  )}`;
  const canonicalUrl = `${process.env.NEXT_PUBLIC_ATTENDEE_URL ?? ""}${canonicalPath}`;

  const noUpcoming = (
    <div className="flex flex-col items-center gap-12">
      <div className="h-48 w-48 bg-neutral-100 rounded-full flex items-center justify-center">
        <div className="w-36 h-36 bg-neutral-200 flex items-center justify-center rounded-full">
          <Ticket size="50" color="#0D0D0D" variant="Bulk" />
        </div>
      </div>
      <span className="font-primary text-[1.8rem] leading-8 text-neutral-600">
        {t("profile.noUpcoming")}
      </span>
    </div>
  );

  return (
    <AttendeeLayout title={organisation.organisationName}>
      {/* Organization markup plus the trail back to the listing, so the page can
          surface as a rich result rather than a bare blue link. */}
      <JsonLd
        data={buildOrganisationJsonLd({
          organisation,
          url: canonicalUrl,
        })}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Organisations", path: `/${locale}/organisations` },
          { name: organisation.organisationName },
        ])}
      />
      <div className="flex flex-col gap-4">
        <BackButton text={t("back")} />
        <div className="flex items-center justify-between gap-4 mb-4">
          <span className="font-primary font-medium text-[2.6rem] leading-12 text-black">
            {organisation.organisationName}{" "}
            {organisation.isVerified && <VerifiedOrganisationCheckMark />}
          </span>
          {/* Desktop shares from the title row; on mobile the button lives
              beside Follow instead, in OrganizerActions. */}
          <div className="hidden lg:flex shrink-0">
            <ShareEvent url={canonicalUrl} />
          </div>
        </div>
      </div>
      <main className="w-full gap-8 flex flex-col lg:grid lg:grid-cols-[29fr_23fr] lg:min-h-0 lg:overflow-y-auto lg:h-full">
        <div className="flex flex-col gap-8 overflow-y-auto min-h-0">
          <div className="w-full max-h-[29.8rem] overflow-hidden rounded-[10px] shrink-0">
            {organisation.profileImageUrl ? (
              <Image
                src={organisation.profileImageUrl}
                width={580}
                height={298}
                alt={organisation.organisationName}
                className="w-full"
              />
            ) : (
              <div className="w-full h-[29.8rem] font-primary text-white bg-black text-9xl flex justify-center items-center">
                {" "}
                {organisation.organisationName.slice()[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <OrganizerActions
            events={events}
            organisation={organisation}
            shareUrl={canonicalUrl}
          />
          <Separator />
          <div className="flex flex-col gap-4">
            <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
              {t("profile.about")}
            </span>
            <p className="text-[1.5rem] leading-12 text-neutral-700">
              {organisation.organisationDescription}
            </p>
          </div>
          <Separator />
          <ContactInfo
            email={organisation.organisationEmail}
            phone={organisation.organisationPhoneNumber}
            website={organisation.organisationWebsite}
          />
          <div className="lg:hidden">
            <Separator />
          </div>
          <div className="lg:hidden flex flex-col gap-8">
            {upcomingEvents.length > 0 && (
              <div className="flex flex-col gap-8">
                <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                  {t("profile.upcoming")}
                </span>
                <ul className="flex flex-col gap-8">
                  {upcomingEvents.map((event) => {
                    return (
                      <li key={event.eventId} className="lg:pr-4">
                        <EventCard aside={true} event={event} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {upcomingEvents.length === 0 && noUpcoming}
          </div>
          {pastEvents.length > 0 && (
            <div className="lg:hidden flex flex-col gap-8">
              <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                {t("profile.past")}
              </span>
              <ul className="flex flex-col gap-8">
                {pastEvents.map((event) => {
                  return (
                    <li key={event.eventId} className="lg:pr-4">
                      <EventCard aside={true} event={event} />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <div></div>
        </div>
        <div className="hidden lg:flex lg:flex-col lg:overflow-y-auto min-h-0 pt-0 gap-20">
          {/* Figma: with nothing coming up, the column centres the empty state. */}
          {upcomingEvents.length === 0 && (
            <div
              className={`flex items-center justify-center ${pastEvents.length > 0 ? "py-16" : "flex-1"}`}
            >
              {noUpcoming}
            </div>
          )}
          {upcomingEvents.length > 0 && (
            <div className="flex flex-col gap-4">
              <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                {t("profile.upcoming")}
              </span>

              <ul className="flex flex-col gap-8">
                {upcomingEvents.map((event) => {
                  return (
                    <li key={event.eventId} className="lg:pr-4">
                      <EventCard aside={true} event={event} />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {pastEvents.length > 0 && (
            <div className="flex flex-col gap-4">
              <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                {t("profile.past")}
              </span>
              <ul className="flex flex-col gap-8">
                {pastEvents.map((event) => {
                  return (
                    <li key={event.eventId} className="lg:pr-4">
                      <EventCard aside={true} event={event} />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </main>
    </AttendeeLayout>
  );
}
