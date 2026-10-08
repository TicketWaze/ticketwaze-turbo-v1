import { redirect } from "next/navigation";

/**
 * Old per-category in-person form URL. The form lives on the unified Create
 * Event page now; the category rides along so it arrives pre-selected.
 */
export default async function InPersonPage({
  params,
}: {
  params: Promise<{ eventType: string }>;
}) {
  const { eventType } = await params;
  redirect(
    `/events/create/event?type=physical&category=${encodeURIComponent(eventType)}`,
  );
}
