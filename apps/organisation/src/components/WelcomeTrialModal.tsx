"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";

const WelcomeTrialDialog = dynamic(() => import("./WelcomeTrialDialog"), {
  ssr: false,
});

// Per person and organisation: someone else on the same device still gets asked.
const seenKey = (scope: string) => `tw:welcome-seen:${scope}`;

/** Once seen, the tour never comes back: no need to ask again. */
export function markWelcomeSeen(scope: string) {
  try {
    window.localStorage.setItem(seenKey(scope), "1");
  } catch {}
}

function seen(scope: string) {
  try {
    return window.localStorage.getItem(seenKey(scope)) === "1";
  } catch {
    return false;
  }
}

/**
 * Asks the API whether this organisation still owes the welcome tour, and
 * mounts it if so. The answer only ever goes from "not seen" to "seen", so a
 * "seen" is remembered on the device and later pages skip the request — this
 * sits on every page, and each request is a round trip on a slow connection.
 */
export default function WelcomeTrialModal() {
  const { data: session } = useSession();
  const [show, setShow] = useState<{ isAdmin: boolean } | null>(null);
  const orgId = session?.activeOrganisation?.organisationId;
  const token = session?.user?.accessToken;
  const userId = session?.user?.userId;

  useEffect(() => {
    if (!orgId || !token || !userId) return;
    const scope = `${userId}:${orgId}`;
    if (seen(scope)) return;
    let cancelled = false;

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${orgId}/welcome-modal`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
      },
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.hasSeenWelcomeModal === false) {
          setShow({ isAdmin: data.isAdmin !== false });
        } else if (data?.hasSeenWelcomeModal === true) {
          markWelcomeSeen(scope);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [orgId, token, userId]);

  return show ? <WelcomeTrialDialog isAdmin={show.isAdmin} /> : null;
}
