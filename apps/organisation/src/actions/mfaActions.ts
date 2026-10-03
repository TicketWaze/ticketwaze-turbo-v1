"use server";
import { resendMfaLogin } from "@ticketwaze/auth";

/** "Resend code" on the 2FA login step. */
export async function ResendLoginCodeAction(challengeId: string) {
  return resendMfaLogin(challengeId);
}
