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
          redirect_uri: `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/api/auth/callback/google`,
        },
      },
    }),
    Credentials({
      credentials: {
        email: {},
        otp: {},
      },
      authorize: async (credentials) => {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/admin/verify-otp`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              otp: credentials.otp,
            }),
          },
        );

        const data = await response.json();

        if (data.status !== "success") {
          throw new Error(data.message || "Invalid verification code");
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
    /**
     * SIGN IN — handle Google automated user creation via API
     */
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/login/google`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: user.email,
                name: user.name,
                avatar: user.image,
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
          // Map userId to id and attach to user
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

    /**
     * JWT CALLBACK
     */
    async jwt({ token, user, trigger, session }) {
      // First login (credentials or google) — store midnight expiry in a custom
      // field; NextAuth v5 overwrites the reserved `exp` claim with iat+maxAge.
      if (user) {
        return { ...token, ...user, accessTokenExpires: nextMidnightUnix() };
      }

      // Manual update() call
      if (trigger === "update" && session?.user) {
        return { ...token, ...session.user };
      }

      return token;
    },

    /**
     * SESSION CALLBACK
     */
    async session({ session, token }) {
      session.user = token as unknown as never;
      return session;
    },

    redirect({ url, baseUrl }) {
      return url;
    },
  },
});

export const handlers: typeof nextAuthResult.handlers = nextAuthResult.handlers;
export const signIn: typeof nextAuthResult.signIn = nextAuthResult.signIn;
export const signOut: typeof nextAuthResult.signOut = nextAuthResult.signOut;
export const auth: typeof nextAuthResult.auth = nextAuthResult.auth;
