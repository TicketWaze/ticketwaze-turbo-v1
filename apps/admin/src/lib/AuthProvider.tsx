"use client";
import { useEffect } from "react";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useLocale } from "next-intl";

function SessionWatcher() {
  const { data: session } = useSession();
  const locale = useLocale();

  useEffect(() => {
    if ((session as Record<string, unknown> | null)?.error === "AccessTokenExpired") {
      signOut({
        redirect: true,
        redirectTo: `${process.env.NEXT_PUBLIC_ADMIN_URL}/${locale}/auth/login`,
      });
    }
  }, [session, locale]);

  return null;
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <SessionProvider>
        <SessionWatcher />
        {children}
      </SessionProvider>
    </GoogleOAuthProvider>
  );
}
