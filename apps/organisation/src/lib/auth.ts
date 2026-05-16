/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

const nextAuthResult = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60,
  },
  jwt: {
    maxAge: 2 * 60 * 60,
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
              }),
            },
          );
          const data = await response.json();
          if (data.status !== "success") {
            if (response.status === 401) {
              throw new Error("Google sign-in failed, please try again");
            }
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
    /**
     * SIGN IN — handle Google OAuth redirect flow via API
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
                idToken: account.id_token,
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

    /**
     * JWT CALLBACK
     */
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const customUser =
          user as unknown as import("@ticketwaze/typescript-config").User;
        token = { ...token, ...customUser };
        token.activeOrganisation = customUser.organisations?.[0] ?? null;
      }

      if (trigger === "update" && session?.activeOrganisation) {
        token.activeOrganisation = session.activeOrganisation;
      }

      return token;
    },

    /**
     * SESSION CALLBACK
     */
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
