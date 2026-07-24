/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

async function refreshAccessToken(token: Record<string, unknown>) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token.refreshToken}` },
    });

    const data = await res.json();

    if (res.status === 401 || data.status !== "success") {
      // Refresh token is revoked or expired — clear the session
      return null;
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
          { headers: { Authorization: `Bearer ${data.accessToken}` } },
        );
        const meData = await meRes.json();
        if (meData?.status === "success" && meData.organisation) {
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
              }),
            },
          );
          const data = await response.json();
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
            }),
          },
        );

        const data = await response.json();
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
              }),
            },
          );
          const data = await res.json();
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
