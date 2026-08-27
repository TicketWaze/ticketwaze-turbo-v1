import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { cookies } from "next/headers";

/**
 * Read a response body as JSON without trusting it to BE JSON.
 *
 * POST /auth/refresh does not always answer in JSON. When the throttle on that
 * route trips, AdonisJS content-negotiates the ThrottleException, and for a
 * request that asks for no particular content type it replies with the
 * plain-text body "Too many requests". Calling res.json() on that threw, which
 * dropped the refresh into its catch clause and kept the EXPIRED access token
 * in the session. Every server component then sent that dead token as a real
 * bearer credential: a silently broken page for the user, and a 401
 * "Authentication Failed" alert that read as a session fault rather than as
 * the rate limit it actually was.
 */
async function readJsonBody<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type RefreshResponse = {
  status?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  isOnboarded?: boolean;
  isSuspended?: boolean;
  suspensionReason?: string | null;
};

async function refreshAccessToken(token: Record<string, unknown>) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.refreshToken}`,
        // Ask for JSON explicitly. Without it the API picks a representation by
        // content negotiation and renders its errors as plain text.
        Accept: "application/json",
      },
    });

    const data = await readJsonBody<RefreshResponse>(res);

    // A 401 is the one answer that means the refresh token itself is gone:
    // revoked, expired, or rotated past its grace window. Clearing the session
    // belongs here, and only here.
    if (res.status === 401) {
      return null;
    }

    // Everything else that is not a success is transient — a 429 from the
    // refresh throttle, a 5xx, or a body that did not parse. None of those mean
    // the refresh token is bad, so none of them may sign the user out. Keep the
    // session and let the next call retry; the error flag marks the attempt as
    // failed for anything that wants to inspect it.
    if (!res.ok || data?.status !== "success") {
      return { ...token, error: "RefreshAccessTokenError" as const };
    }

    return {
      ...token,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      accessTokenExpires: data.accessTokenExpires,
      // Self-heal stale sessions: tokens seeded before the user completed
      // onboarding carry isOnboarded=false for up to 30 days otherwise.
      ...(typeof data.isOnboarded === "boolean"
        ? { isOnboarded: data.isOnboarded }
        : {}),
      // Same self-healing for suspension. A session that began before the
      // suspension would otherwise show a fully normal interface, and the user
      // would learn they were sanctioned by having a purchase fail at checkout
      // rather than by being told.
      ...(typeof data.isSuspended === "boolean"
        ? {
            isSuspended: data.isSuspended,
            suspensionReason: data.suspensionReason ?? null,
          }
        : {}),
      error: undefined,
    };
  } catch {
    // Network/server error — keep the existing token and retry next time
    return { ...token, error: "RefreshAccessTokenError" as const };
  }
}

const nextAuthResult = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          redirect_uri: `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/api/auth/callback/google`,
        },
      },
    }),
    Credentials({
      credentials: {
        email: {},
        password: {},
        googleIdToken: {},
        referralCode: {},
      },
      authorize: async (credentials) => {
        if (credentials.googleIdToken) {
          const body: Record<string, string> = {
            idToken: credentials.googleIdToken as string,
          };
          if (credentials.referralCode) {
            body.referralCode = credentials.referralCode as string;
          }
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/login/google`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            },
          );
          const data = await response.json();
          if (data.status !== "success") {
            if (response.status === 401) {
              throw new Error("Google sign-in failed, please try again");
            }
            throw new Error(data.message || "Google sign-in failed");
          }
          return {
            ...data.user,
            id: data.user.userId,
            deletionCancelled: data.deletionCancelled ?? false,
          };
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          },
        );

        const data = await response.json();

        if (data.status !== "success") {
          throw new Error(data.message || "Invalid credentials");
        }

        return { ...data.user, deletionCancelled: data.deletionCancelled ?? false };
      },
    }),
  ],

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        // Mobile redirect flow stashes the referral in a cookie (the popup path
        // passes it inline instead). Best-effort: attribution is non-critical.
        let referralCode: string | undefined;
        try {
          referralCode = (await cookies()).get("referral_code")?.value;
        } catch {}

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/login/google`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              idToken: account.id_token,
              ...(referralCode ? { referralCode } : {}),
            }),
          },
        );

        const data = await res.json();
        if (data.status !== "success") {
          throw new Error(
            encodeURIComponent(data.message || "Google authentication failed"),
          );
        }
        Object.assign(user, {
          ...data.user,
          id: data.user.userId,
          deletionCancelled: data.deletionCancelled ?? false,
        });
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // First login — seed all fields from the API response
      if (user) {
        return { ...token, ...user };
      }

      // Manual update() call (e.g. profile refresh)
      if (trigger === "update" && session?.user) {
        return { ...token, ...session.user };
      }

      // Old session (before this update) has no accessTokenExpires — leave it alone
      if (!token.accessTokenExpires) {
        return token;
      }

      // Token still has more than 1 minute of life left
      if (Date.now() < (token.accessTokenExpires as number) - 60_000) {
        return token;
      }

      // No refresh token available (shouldn't happen after a fresh login)
      if (!token.refreshToken) {
        return token;
      }

      return refreshAccessToken(token as Record<string, unknown>);
    },

    async session({ session, token }) {
      session.user = token as unknown as never;
      return session;
    },

    redirect({ url, baseUrl }) {
      // Prevent open redirects: allow only relative paths or same-origin URLs.
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {}
      return baseUrl;
    },
  },
});

export const handlers: typeof nextAuthResult.handlers = nextAuthResult.handlers;
export const signIn: typeof nextAuthResult.signIn = nextAuthResult.signIn;
export const signOut: typeof nextAuthResult.signOut = nextAuthResult.signOut;
export const auth: typeof nextAuthResult.auth = nextAuthResult.auth;
