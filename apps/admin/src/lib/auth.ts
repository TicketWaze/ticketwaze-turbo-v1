import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

/**
 * A refusal from the API, surfaced to the page as `result.code` (e.g.
 * INVALID_CODE, CODE_EXPIRED, INVITATION_EXPIRED) so it can show the right
 * message instead of a generic failure.
 */
class AdminAuthError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
  }
}

/**
 * POSTs to an admin auth endpoint that answers with `{ admin }` (a session),
 * and turns any other answer into an AdminAuthError. Runs on this app's
 * server, so the API throttles these routes per account, not per IP.
 */
async function adminSession(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (response?.status === 429) throw new AdminAuthError("TOO_MANY_ATTEMPTS");
  const data = await response?.json().catch(() => null);
  if (data?.status !== "success" || !data.admin) {
    throw new AdminAuthError(
      String(data?.code ?? (data?.status === "same" ? "SAME_PASSWORD" : "FAILED")),
    );
  }
  return { ...data.admin, id: data.admin.adminId };
}

const field = (value: unknown) => (typeof value === "string" ? value : "");

function nextMidnightUnix(): number {
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return Math.floor(midnight.getTime() / 1000);
}

/**
 * The admin session is deliberately NOT the shared Ticketwaze session (see
 * @ticketwaze/auth): an attendee or organiser sign-in must never open the
 * admin dashboard. Its own cookie name keeps it apart — Auth.js derives the
 * encryption key from the name, so neither cookie can be read as the other —
 * and it stays host-only, with no parent domain. Give this app its own
 * AUTH_SECRET as well, so the separation does not rest on the name alone.
 */
const useSecureCookies = (process.env.AUTH_URL ?? "").startsWith("https://");

const nextAuthResult = NextAuth({
  cookies: {
    sessionToken: {
      name: `${useSecureCookies ? "__Secure-" : ""}ticketwaze.admin.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
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
    // Password sign-in, second step: the 6-digit code emailed by
    // POST /auth/admin/login (the page calls that one directly).
    Credentials({
      id: "admin-code",
      credentials: { email: {}, otp: {} },
      authorize: (credentials) =>
        adminSession("/auth/admin/verify-otp", {
          email: field(credentials.email).toLowerCase(),
          otp: field(credentials.otp),
        }),
    }),
    // /auth/join: accept an invitation by choosing a password.
    Credentials({
      id: "admin-invitation",
      credentials: { token: {}, password: {}, password_confirmation: {} },
      authorize: (credentials) =>
        adminSession(
          `/auth/admin/invitation/${encodeURIComponent(field(credentials.token))}`,
          {
            password: field(credentials.password),
            password_confirmation: field(credentials.password_confirmation),
          },
        ),
    }),
    // Reset password, last step: the new password, signed straight in.
    Credentials({
      id: "admin-reset",
      credentials: {
        email: {},
        resetToken: {},
        password: {},
        password_confirmation: {},
      },
      authorize: (credentials) =>
        adminSession("/auth/admin/forgot-password/reset", {
          email: field(credentials.email).toLowerCase(),
          resetToken: field(credentials.resetToken),
          password: field(credentials.password),
          password_confirmation: field(credentials.password_confirmation),
        }),
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
        const data = await res.json().catch(() => null);
        if (data?.status !== "success") {
          // Back to the sign-in page with a code it can explain, e.g.
          // NOT_INVITED or DOMAIN_NOT_ALLOWED (next-intl adds the locale).
          const code =
            res.status === 429 ? "TOO_MANY_ATTEMPTS" : (data?.code ?? "GOOGLE_FAILED");
          return `/auth/login?error=${encodeURIComponent(code)}`;
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
