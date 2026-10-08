import { getLocale } from "next-intl/server";
import type { KycStatus } from "@ticketwaze/typescript-config";
import { auth } from "@/lib/auth";

/**
 * The active organisation's KYC status for server components, and whether
 * this member may submit it (owner-level `organisation.manage`). Null when it
 * can't be read, in which case callers don't gate: the API still refuses.
 */
export async function getKycAccess(): Promise<{
  status: KycStatus;
  canVerify: boolean;
} | null> {
  const session = await auth();
  const organisation = session?.activeOrganisation;
  if (!organisation?.organisationId || !session?.user?.accessToken) return null;
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisation.organisationId}/kyc`,
      {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
          "Accept-Language": await getLocale(),
          Origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        cache: "no-store",
      },
    );
    const response = await request.json();
    if (response.status !== "success") return null;
    const permissions: string[] = organisation.myPermissions ?? [];
    return {
      status: response.kyc.status,
      canVerify: permissions.includes("organisation.manage"),
    };
  } catch {
    return null;
  }
}
