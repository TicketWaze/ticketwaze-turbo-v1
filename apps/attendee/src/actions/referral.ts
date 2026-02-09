"use server";

import { cookies } from "next/headers";

export async function getReferralCode() {
  const cookieStore = await cookies();
  const referralCode = cookieStore.get("referral_code")?.value;
  return referralCode || null;
}

export async function deleteReferralCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("referral_code");
}
