import type { Organisation } from "@ticketwaze/typescript-config";

// Accepting or declining a team invitation for the signed-in account, shared
// by the invitation link page and the onboarding screen.

function headers(accessToken: string, locale: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    "Accept-Language": locale,
    Origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
  };
}

/**
 * Joins `organisationId` and returns it as the session stores it (role,
 * permissions, plan). Null when there is no invite for this account.
 */
export async function acceptInvitation(
  organisationId: string,
  accessToken: string,
  locale: string,
): Promise<(Organisation & { membershipTier?: unknown }) | null> {
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/invite/${organisationId}`,
    { headers: headers(accessToken, locale) },
  );
  const response = await request.json().catch(() => null);
  if (response?.status !== "success" || !response.organisation) return null;
  return { ...response.organisation, membershipTier: response.membershipTier };
}

export async function declineInvitation(
  organisationId: string,
  accessToken: string,
  locale: string,
) {
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/invite/${organisationId}`,
    { method: "DELETE", headers: headers(accessToken, locale) },
  );
  const response = await request.json().catch(() => null);
  return response?.status === "success";
}
