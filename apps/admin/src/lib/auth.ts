import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

function nextMidnightUnix(): number {
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return Math.floor(midnight.getTime() / 1000);
}

const nextAuthResult = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },

  jwt: {
    maxAge: 24 * 60 * 60,
  },

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          redirect_uri: `${process.env.NEXT_PUBLIC_ADMIN_URL}/api/auth/callback/google`,
        },
      },
    }),
    Credentials({
      credentials: {
        googleIdToken: {},
      },
      authorize: async (credentials) => {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/admin/login/google`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: credentials.googleIdToken }),
          },
        );

        const data = await response.json();

        if (data.status !== "success") {
          throw new Error(data.message || "Google sign-in failed");
        }

        return { ...data.admin, id: data.admin.adminId };
      },
    }),
  ],

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  callbacks: {
    /**
     * SIGN-IN CALLBACK
     * Full-page google redirect flow: exchange the id_token from Google for an
     * admin session against the admin-only endpoint (enforces @ticketwaze.com).
     */
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/admin/login/google`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: account.id_token }),
          },
        );
        const data = await res.json();
        if (data.status !== "success") {
          throw new Error(
            encodeURIComponent(data.message || "Google authentication failed"),
          );
        }
        Object.assign(user, { ...data.admin, id: data.admin.adminId });
      }
      return true;
    },

    /**
     * JWT CALLBACK
     */
    async jwt({ token, user, trigger, session }) {
      // First login — store the API token and its midnight expiry.
      if (user) {
        return { ...token, ...user, accessTokenExpires: nextMidnightUnix() };
      }

      // Manual update() call
      if (trigger === "update" && session?.user) {
        return { ...token, ...session.user };
      }

      // API token has expired — mark the session so the client can sign out.
      if (
        token.accessTokenExpires &&
        Date.now() / 1000 > (token.accessTokenExpires as number)
      ) {
        return { ...token, error: "AccessTokenExpired" as const };
      }

      return token;
    },

    /**
     * SESSION CALLBACK
     */
    async session({ session, token }) {
      session.user = token as unknown as never;
      if (token.error) {
        (session as unknown as Record<string, unknown>).error = token.error;
      }
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
