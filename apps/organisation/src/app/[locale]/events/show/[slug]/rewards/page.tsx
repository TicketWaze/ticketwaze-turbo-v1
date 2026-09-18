import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale, getTranslations } from "next-intl/server";
import BackButton from "@/components/shared/BackButton";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import { extractIdFromSlug } from "@/lib/Slugify";
import { GetReward } from "@/actions/RewardActions";
import RewardPageContent from "./RewardPageContent";

/**
 * The reward screen, reached from More → Rewards on the activity page.
 *
 * Fetched server-side like every other organiser screen, so the access token
 * stays off the browser. There is at most one reward per activity, so this is a
 * single record with its grants rather than a list.
 */
export default async function EventRewardsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const locale = await getLocale();
  const t = await getTranslations("Events.single_event.rewards");
  const { slug } = await params;
  const eventId = extractIdFromSlug(slug);

  const result = await GetReward(eventId, locale);

  if ("error" in result) {
    return (
      <OrganizerLayout title={t("title")}>
        {result.error === "Unauthorized" ? (
          <UnauthorizedView />
        ) : (
          <FetchFailedErrorView />
        )}
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout title={t("title")}>
      <BackButton text={t("back")} />
      <RewardPageContent
        activityId={eventId}
        reward={result.reward}
        grants={result.grants}
        canCreate={result.canCreate}
      />
    </OrganizerLayout>
  );
}
