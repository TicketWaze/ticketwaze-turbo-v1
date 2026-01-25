import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60,
  },
  jwt: {
    maxAge: 2 * 60 * 60,
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: credentials?.email,
                password: credentials?.password,
              }),
            },
          );

          if (!response.ok) {
            return null;
          }
          const data = await response.json();
          if (!data.status || data.status !== "success") {
            return null;
          }
          return data.user;
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: `/auth/login`,
    error: `/auth/login`,
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign-in
      if (user) {
        const customUser =
          user as unknown as import("@ticketwaze/typescript-config").User;
        token = { ...token, ...customUser };
        token.activeOrganisation = customUser.organisations?.[0] ?? null;
      }

      // Manual update (client calls `update()`)
      if (trigger === "update" && session?.activeOrganisation) {
        token.activeOrganisation = session.activeOrganisation;
      }

      return token;
    },
    async session({ session, token }) {
      // copy token into session
      session.user = token as any;
      session.activeOrganisation = (token as any).activeOrganisation ?? null;
      return session;
    },
    redirect({ url, baseUrl }) {
      return url;
    },
  },
});
