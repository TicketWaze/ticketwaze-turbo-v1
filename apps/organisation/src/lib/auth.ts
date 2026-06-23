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

    return {
      ...token,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      accessTokenExpires: data.accessTokenExpires,
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
            throw new Error(
              encodeURIComponent(
                data.message || "Google authentication failed",
              ),
            );
          }
          Object.assign(user, {
            ...data.user,
            id: data.user.userId,
          });
          return true;
        } catch (error) {
          throw error;
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

    redirect({ url }) {
      return url;
    },
  },
});

export const handlers: typeof nextAuthResult.handlers = nextAuthResult.handlers;
export const signIn: typeof nextAuthResult.signIn = nextAuthResult.signIn;
export const signOut: typeof nextAuthResult.signOut = nextAuthResult.signOut;
export const auth: typeof nextAuthResult.auth = nextAuthResult.auth;
