/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

/**
 * Every login request from this app announces which door it is knocking on.
 * The API refuses an organisation-app sign-in whose organisations are all
 * suspended, while leaving the same person's attendee account alone — it can
 * only draw that line if it knows where the request came from.
 */
const LOGIN_CONTEXT = "organisation" as const;

/**
 * Auth.js discards the message of an error thrown inside `authorize` and
 * reports a bare `CredentialsSignin` — which is how a suspended organisation
 * would otherwise reach the login page as "wrong password". A subclass is the
 * supported way through: its `code` survives to the client, so the page can
 * render the real reason in the user's own language.
 */
class OrganisationSuspendedError extends CredentialsSignin {
  code = "organisation_suspended";
}

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

type MembershipContextResponse = {
  status?: string;
  organisation?: {
    isSuspended?: boolean;
    myRole?: unknown;
    myPermissions?: unknown;
  };
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

    /**
     * Re-read the active organisation's membership context.
     *
     * myRole/myPermissions are seeded once at login and otherwise only change
     * when the user switches organisation, so granting someone a permission had
     * no effect on their session until they logged out — for up to the 30-day
     * refresh-token lifetime. Refreshing here bounds that to one access-token
     * period. The endpoint is Redis-cached server-side, and this runs only when
     * the access token is close to expiry, so it is not a per-request cost.
     *
     * Failure is non-fatal: a refreshed access token is worth keeping even if
     * the permission re-read fails, so the previous context carries over.
     */
    const activeOrganisation = token.activeOrganisation as
      | (Record<string, unknown> & { organisationId?: string })
      | null
      | undefined;
    let refreshedOrganisation: typeof activeOrganisation = activeOrganisation;

    if (activeOrganisation?.organisationId) {
      try {
        const meRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/organisations/${activeOrganisation.organisationId}/me`,
          {
            headers: {
              Authorization: `Bearer ${data.accessToken}`,
              Accept: "application/json",
            },
          },
        );
        const meData = await readJsonBody<MembershipContextResponse>(meRes);
        if (meData?.status === "success" && meData.organisation) {
          // Suspension can land mid-session. Clearing the token drops the user
          // at the login page, where the API explains the refusal — far better
          // than leaving them in a dashboard whose every button now fails.
          if (meData.organisation.isSuspended) {
            return null;
          }
          refreshedOrganisation = {
            ...activeOrganisation,
            myRole: meData.organisation.myRole ?? null,
            myPermissions: meData.organisation.myPermissions ?? [],
          };
        }
      } catch {
        // Keep the context we already have.
      }
    }

    return {
      ...token,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      accessTokenExpires: data.accessTokenExpires,
      activeOrganisation: refreshedOrganisation,
      // Self-heal stale sessions: tokens seeded before the user completed
      // onboarding carry isOnboarded=false for up to 30 days otherwise.
      ...(typeof data.isOnboarded === "boolean"
        ? { isOnboarded: data.isOnboarded }
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
          redirect_uri: `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/api/auth/callback/google`,
        },
      },
    }),
    Credentials({
      credentials: {
        email: {},
        password: {},
        googleIdToken: {},
      },
      authorize: async (credentials) => {
        if (credentials.googleIdToken) {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/login/google`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                idToken: credentials.googleIdToken as string,
                noCreate: true,
                context: LOGIN_CONTEXT,
              }),
            },
          );
          const data = await response.json();
          if (data.code === "ORGANISATION_SUSPENDED") {
            throw new OrganisationSuspendedError();
          }
          if (data.status !== "success") {
            throw new Error(data.message || "Google sign-in failed");
          }
          return { ...data.user, id: data.user.userId };
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              context: LOGIN_CONTEXT,
            }),
          },
        );

        const data = await response.json();
        if (data.code === "ORGANISATION_SUSPENDED") {
          throw new OrganisationSuspendedError();
        }
        if (data.status !== "success") {
          throw new Error(data.message || "Invalid credentials");
        }
        return data.user;
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
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/login/google`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                idToken: account.id_token,
                noCreate: true,
                context: LOGIN_CONTEXT,
              }),
            },
          );
          const data = await res.json();
          if (data.code === "ORGANISATION_SUSPENDED") {
            return `/auth/login?error=organisation_suspended`;
          }
          if (data.status !== "success") {
            // Returning a URL rather than throwing: Auth.js turns a thrown
            // error into a bare `AccessDenied` code and discards the message,
            // so the one thing the user needs to know — that this Google
            // account has no Ticketwaze account yet — would be lost.
            //
            // A stable code travels instead of the API's English sentence, so
            // the login page can render the notice in the user's language.
            const code = res.status === 404 ? "no_account" : "google_failed";
            return `/auth/login?error=${code}`;
          }
          Object.assign(user, {
            ...data.user,
            id: data.user.userId,
          });
          return true;
        } catch {
          return `/auth/login?error=google_failed`;
        }
      }
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // First login — seed all fields from the API response
      if (user) {
        const customUser =
          user as unknown as import("@ticketwaze/typescript-config").User;
        token = { ...token, ...customUser };
        token.activeOrganisation = customUser.organisations?.[0] ?? null;
        return token;
      }

      // Manual update() call (e.g. switching active organisation)
      if (trigger === "update" && session?.activeOrganisation) {
        token.activeOrganisation = session.activeOrganisation;
        return token;
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
      session.user = token as any;
      session.activeOrganisation = (token as any).activeOrganisation ?? null;
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
