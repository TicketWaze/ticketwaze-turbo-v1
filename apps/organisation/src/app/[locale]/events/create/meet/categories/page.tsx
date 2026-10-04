import { redirect } from "next/navigation";

/**
 * Where the platform picker and the Zoom/Google connect pages used to send
 * the organiser next. The category is chosen inside the unified Create Event
 * form now, so this hands the platform (and Google's OAuth code) over to it.
 */
export default async function OnlineCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; provider?: string }>;
}) {
  const { code, provider } = await searchParams;
  const query = new URLSearchParams({ type: "virtual" });
  if (provider) query.set("provider", provider);
  if (code) query.set("code", code);
  redirect(`/events/create/event?${query}`);
}
