import { cookies } from "next/headers";
import { readSharedSession } from "@ticketwaze/auth";

/**
 * Who is signed in, for the navbar.
 *
 * The session cookie is shared with the attendee and organisation apps (see
 * @ticketwaze/auth) and is httpOnly, so the page asks here. Only what the
 * navbar shows leaves the server — never the tokens.
 */
export async function GET() {
  const token = await readSharedSession((await cookies()).getAll());
  const expires = token?.exp ? Number(token.exp) * 1000 : 0;

  const user =
    token && expires > Date.now()
      ? {
          firstName: String(token.firstName ?? ""),
          lastName: String(token.lastName ?? ""),
          profileImageUrl:
            typeof token.profileImageUrl === "string"
              ? token.profileImageUrl
              : null,
          hasOrganisation:
            Array.isArray(token.organisations) &&
            token.organisations.length > 0,
        }
      : null;

  return Response.json(
    { user },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
