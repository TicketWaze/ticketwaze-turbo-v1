import { CredentialsSignin } from "next-auth";
import {
  encodeMfaChallenge,
  encodeMfaFailure,
  type MfaCodeFailure,
} from "./mfa-shared";

/**
 * EMAIL 2FA — the server half, used inside each app's `authorize`.
 *
 * The API answers a password login for a 2FA account with `mfa_required`
 * instead of tokens. `authorize` turns that into `MfaRequiredError`, whose
 * code carries the challenge to the login page; the page then signs in again
 * with `{ challengeId, code }`, which `verifyMfaLogin` sends to the API.
 * Tokens never leave the server, exactly as with a plain password login.
 */
export class MfaRequiredError extends CredentialsSignin {
  constructor(data: {
    challengeId: string;
    email: string;
    resendAfterSeconds?: number;
  }) {
    super();
    this.code = encodeMfaChallenge({
      challengeId: data.challengeId,
      email: data.email,
      resendAfterSeconds: data.resendAfterSeconds ?? 60,
    });
  }
}

export class MfaCodeError extends CredentialsSignin {
  constructor(reason: MfaCodeFailure, attemptsLeft?: number) {
    super();
    this.code = encodeMfaFailure(reason, attemptsLeft);
  }
}

/** Throws `MfaRequiredError` when a login answer asks for the emailed code. */
export function assertNoMfa(data: {
  status?: string;
  challengeId?: string;
  email?: string;
  resendAfterSeconds?: number;
}) {
  if (data?.status === "mfa_required" && data.challengeId) {
    throw new MfaRequiredError({
      challengeId: data.challengeId,
      email: data.email ?? "",
      resendAfterSeconds: data.resendAfterSeconds,
    });
  }
}

/**
 * The second step: exchanges `{ challengeId, code }` for the same login
 * payload `/auth/login` returns. Throws `MfaCodeError` on a wrong code.
 */
export async function verifyMfaLogin(challengeId: unknown, code: unknown) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/login/verify`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, code }),
    },
  );
  const data = await response.json().catch(() => null);
  if (data?.status !== "success") {
    throw new MfaCodeError(
      (data?.code as MfaCodeFailure) ?? "INVALID_CODE",
      data?.attemptsLeft,
    );
  }
  return data as {
    status: "success";
    deletionCancelled?: boolean;
    user: Record<string, unknown>;
  };
}

/** For a "Resend code" button (called from a server action). */
export async function resendMfaLogin(challengeId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/login/resend`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId }),
    },
  );
  const data = await response.json().catch(() => null);
  return data?.status === "mfa_required"
    ? {
        ok: true as const,
        resendAfterSeconds: Number(data.resendAfterSeconds ?? 60),
      }
    : {
        ok: false as const,
        code: (data?.code as MfaCodeFailure) ?? "CHALLENGE_NOT_FOUND",
        retryAfterSeconds: data?.retryAfterSeconds as number | undefined,
      };
}
