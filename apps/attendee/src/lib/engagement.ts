import {
  recordSignedInEngagement,
  type ShareChannel,
} from "@/actions/engagementActions";

/**
 * Report a view or share of an activity to the organiser's analytics.
 * Fire-and-forget: never awaited by UI, never surfaces an error.
 */
export function trackEngagement(
  activityId: string,
  kind: "view" | "share",
  channel?: ShareChannel,
) {
  recordSignedInEngagement(activityId, kind, channel)
    .then((handled) => {
      if (handled) return;
      // keepalive lets a share report survive the tab navigating away.
      return fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/activities/${activityId}/${kind}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(kind === "share" ? { channel } : {}),
          keepalive: true,
        },
      );
    })
    .catch(() => {});
}

export type { ShareChannel };
