import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import ZoomConnected from "./ZoomConnected";

/**
 * WHERE ZOOM SENDS THE ORGANISER BACK TO.
 *
 * A sibling of `create/meet/` rather than a child, deliberately: `create/meet/`
 * has a dynamic `[eventType]` segment, and a static route nested under it is
 * the kind of thing that works until someone adds an event category with the
 * same name. This path can never collide.
 *
 * `ZOOM_REDIRECT_URI` on the API must match this exact URL, and the same URL
 * must be registered on the Zoom Marketplace app.
 */
export default async function ZoomConnectedPage({
  searchParams,
}: {
  searchParams: Promise<{
    code: string | undefined;
    state: string | undefined;
    error: string | undefined;
  }>;
}) {
  const { code, state, error } = await searchParams;
  return (
    <OrganizerLayout title="ZoomConnectedPage">
      <ZoomConnected code={code} state={state} error={error} />
    </OrganizerLayout>
  );
}
