import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import GoogleConnected from "./GoogleConnected";

/**
 * Where the Google OAuth round trip finishes.
 *
 * A sibling of `create/meet/` rather than a child, deliberately: `create/meet/`
 * has a dynamic `[eventType]` segment, and a static route nested under it works
 * only until someone adds an event category with the same name.
 *
 * `googleRedirectUri()` on the API must match this exact URL, and the same URL
 * must be an Authorised redirect URI on the Google Cloud OAuth client.
 */
export default async function GoogleConnectedPage({
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
    <OrganizerLayout title="GoogleConnectedPage">
      <GoogleConnected code={code} state={state} error={error} />
    </OrganizerLayout>
  );
}
