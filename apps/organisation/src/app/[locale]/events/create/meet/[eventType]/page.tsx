import { redirect } from "next/navigation";

/**
 * Old per-category online form URL. Forwards to the unified Create Event page
 * with the category, platform and any OAuth code it was carrying.
 */
export default async function OnlineEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventType: string }>;
  searchParams: Promise<{ code?: string; provider?: string }>;
}) {
  const { eventType } = await params;
  const { code, provider } = await searchParams;
  const query = new URLSearchParams({ type: "virtual", category: eventType });
  query.set("provider", provider === "zoom" ? "zoom" : "google_meet");
  if (code) query.set("code", code);
  redirect(`/events/create/event?${query}`);
}
