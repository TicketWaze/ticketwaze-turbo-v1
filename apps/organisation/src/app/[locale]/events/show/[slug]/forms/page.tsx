import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale, getTranslations } from "next-intl/server";
import BackButton from "@/components/shared/BackButton";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import { extractIdFromSlug } from "@/lib/Slugify";
import { auth } from "@/lib/auth";
import {
  ListFormQuestions,
  ListFormResponses,
} from "@/actions/EventFormActions";
import FormsPageContent from "./FormsPageContent";

/**
 * The checkout form builder, reached from More → Forms on the activity page.
 *
 * Questions AND responses are fetched here rather than in the client: both are
 * needed on first paint, and doing it server-side keeps the access token off
 * the browser like every other organiser screen.
 */
export default async function EventFormsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("Events.single_event.forms");
  const { slug } = await params;
  const eventId = extractIdFromSlug(slug);
  const organisationId = session?.activeOrganisation.organisationId ?? "";
  const accessToken = session?.user.accessToken ?? "";

  const questionsResult = await ListFormQuestions(
    organisationId,
    eventId,
    accessToken,
    locale,
  );

  if ("error" in questionsResult) {
    return (
      <OrganizerLayout title={t("title")}>
        {/* The API returns 403 both for a member without edit rights and for an
            activity type that cannot carry a form; the message says which. */}
        {questionsResult.error === "Unauthorized" ? (
          <UnauthorizedView />
        ) : (
          <FetchFailedErrorView />
        )}
      </OrganizerLayout>
    );
  }

  /**
   * Responses are a nice-to-have on this screen, not a precondition — a failure
   * to load them must not replace a working editor with an error page.
   */
  const responsesResult = await ListFormResponses(
    organisationId,
    eventId,
    accessToken,
    locale,
  );
  const responses =
    "error" in responsesResult ? [] : responsesResult.responses;

  return (
    <OrganizerLayout title={t("title")}>
      <BackButton text={t("back")} />
      <FormsPageContent
        eventId={eventId}
        organisationId={organisationId}
        questions={questionsResult.questions}
        canUseForms={questionsResult.canUseForms}
        maxQuestions={questionsResult.maxQuestions}
        responses={responses}
      />
    </OrganizerLayout>
  );
}
