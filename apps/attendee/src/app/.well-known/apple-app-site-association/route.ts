/**
 * iOS universal links: lets the Ticketwaze app open the invite page
 * (`/auth/register?referral=…`) in place of Safari. The Android twin is the
 * static `public/.well-known/assetlinks.json`, which lists each app package
 * with its signing-key fingerprint (from EAS; add the Play app-signing key
 * there before a Play release, and `com.ticketwaze.preview` after its first
 * build).
 *
 * The paths must match the mobile app's INVITE_PATHS (`app.config.ts`).
 * Every bundle ID is listed: production claims app.ticketwaze.com and the
 * dev/preview builds claim staging.app, but both hosts serve this same file.
 *
 * Served as JSON at the extension-less path Apple fetches. Answers 404 until
 * APPLE_TEAM_ID is set — there is no iOS build yet, and an app ID with a
 * placeholder team would be a claim no app can satisfy.
 */
const BUNDLE_IDS = ["com.ticketwaze", "com.ticketwaze.preview", "com.ticketwaze.dev"];
const INVITE_PATHS = ["/auth/register", "/en/auth/register", "/fr/auth/register"];

export function GET() {
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  if (!teamId) return new Response("Not found", { status: 404 });

  return Response.json({
    applinks: {
      details: [
        {
          appIDs: BUNDLE_IDS.map((id) => `${teamId}.${id}`),
          components: INVITE_PATHS.map((path) => ({ "/": path })),
        },
      ],
    },
  });
}
