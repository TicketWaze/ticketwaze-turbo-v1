"use server";

import { revalidatePath } from "next/cache";

// Organisation KYC decisions. Approving unlocks creating activities and
// withdrawals; rejecting sends the organizer the reason by email.

async function decide(
  verificationId: string,
  organisationId: string,
  decision: "approve" | "reject",
  accessToken: string,
  locale: string,
  reason?: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/kyc/${verificationId}/${decision}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
        body: JSON.stringify(reason ? { reason } : {}),
      },
    );
    const data = await request.json();
    if (data.status !== "success") throw new Error(data.message);
    revalidatePath(`/kyc/${organisationId}`);
    revalidatePath(`/kyc`);
    return { status: "success" as const };
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function ApproveKycAction(
  verificationId: string,
  organisationId: string,
  accessToken: string,
  locale: string,
) {
  return decide(verificationId, organisationId, "approve", accessToken, locale);
}

export async function RejectKycAction(
  verificationId: string,
  organisationId: string,
  reason: string,
  accessToken: string,
  locale: string,
) {
  return decide(verificationId, organisationId, "reject", accessToken, locale, reason);
}
