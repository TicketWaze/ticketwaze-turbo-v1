import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { cookies } from "next/headers";
import {
  needsRefresh,
  refreshApiTokens,
  sanitizeSessionUpdate,
  sharedSessionCookies,
} from "@ticketwaze/auth";

const nextAuthResult = NextAuth({
  // Shared with the website and the organisation app: see @ticketwaze/auth.
  cookies: sharedSessionCookies(),
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

      // Manual update() call (e.g. profile refresh). Credentials in the patch
      // are dropped: they may be older than what another app has since saved.
      if (trigger === "update" && session?.user) {
        return { ...token, ...sanitizeSessionUpdate(session.user) };
      }

      // Old session (before this update) has no accessTokenExpires — leave it alone
      if (!token.accessTokenExpires) {
        return token;
      }

      if (!needsRefresh(token)) {
        return token;
      }

      return refreshApiTokens(token);
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
