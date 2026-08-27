"use client";
import { SessionProvider } from "next-auth/react";
import { GoogleOAuthProvider } from "@react-oauth/google";

/**
 * How often the browser re-reads its session, in seconds.
 *
 * Access tokens live fifteen minutes. Client components hold the one they were
 * given by `useSession()` and hand it to server actions or send it straight to
 * the API, and by default `SessionProvider` refetches only on mount and on
 * window focus — so a screen someone stayed on and worked in, a checkout form
 * being written or a long edit, was still presenting the token it was handed
 * when the page loaded. The API answered "Unauthorized access", which surfaced
 * as an unexplained failure and an auth alert in #logs.
 *
 * Ten minutes leaves at least five minutes of life on every token the browser
 * holds. The refetch runs through Auth.js's own route handler, which is one of
 * the two places it can actually persist a rotated cookie, so this keeps the
 * stored refresh token moving forward too.
 */
const SESSION_REFETCH_SECONDS = 10 * 60;

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      {/* `refetchOnWindowFocus` stays on (the default): a backgrounded tab has
          its timers throttled, so returning to it is the other moment the token
          needs re-reading. */}
      <SessionProvider refetchInterval={SESSION_REFETCH_SECONDS}>
        {children}
      </SessionProvider>
    </GoogleOAuthProvider>
  );
}
