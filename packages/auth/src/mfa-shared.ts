/**
 * EMAIL 2FA — the browser-safe half (no next-auth import).
 *
 * Auth.js only lets a short string `code` travel from `authorize` to the page
 * that called `signIn`. A password login that needs the emailed code fails
 * with code `mfa:<payload>`, a wrong code with `mfa_error:<reason>:<left>`.
 * These helpers build and read those strings so both web apps agree.
 */
export type MfaChallenge = {
  challengeId: string;
  /** Masked, e.g. "j•••@gmail.com" — where the code was sent. */
  email: string;
  resendAfterSeconds: number;
};

export type MfaCodeFailure =
  | "INVALID_CODE"
  | "CODE_EXPIRED"
  | "TOO_MANY_ATTEMPTS"
  | "CHALLENGE_NOT_FOUND"
  | "RESEND_TOO_SOON"
  | "TOO_MANY_RESENDS";

function toBase64Url(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(
    Uint8Array.from(binary, (c) => c.charCodeAt(0)),
  );
}

export function encodeMfaChallenge(challenge: MfaChallenge) {
  return `mfa:${toBase64Url(JSON.stringify(challenge))}`;
}

export function encodeMfaFailure(
  reason: MfaCodeFailure,
  attemptsLeft?: number,
) {
  return `mfa_error:${reason}:${attemptsLeft ?? ""}`;
}

/** Reads the `code` returned by `signIn("credentials", …)`. */
export function readMfaCode(
  code: string | null | undefined,
):
  | { kind: "challenge"; challenge: MfaChallenge }
  | { kind: "failure"; reason: MfaCodeFailure; attemptsLeft?: number }
  | null {
  if (!code) return null;
  if (code.startsWith("mfa:")) {
    try {
      const challenge = JSON.parse(
        fromBase64Url(code.slice(4)),
      ) as MfaChallenge;
      return challenge?.challengeId ? { kind: "challenge", challenge } : null;
    } catch {
      return null;
    }
  }
  if (code.startsWith("mfa_error:")) {
    const [, reason, left] = code.split(":");
    return {
      kind: "failure",
      reason: reason as MfaCodeFailure,
      attemptsLeft: left ? Number(left) : undefined,
    };
  }
  return null;
}
