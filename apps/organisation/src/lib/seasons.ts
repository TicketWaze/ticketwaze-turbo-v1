// Server components only (reads the session through `auth()`).
import { getLocale } from "next-intl/server";
import {
  PhysicalTicketBatch,
  Season,
  SeasonMatch,
  SeasonPassType,
} from "@ticketwaze/typescript-config";
import { auth } from "@/lib/auth";

export type SeasonLoad =
  | {
      status: "ok";
      season: Season;
      matches: SeasonMatch[];
      passTypes: SeasonPassType[];
      /** Printed season tickets Ticketwaze made: a record, not sales. */
      printedBatches: PhysicalTicketBatch[];
    }
  | { status: "forbidden" }
  | { status: "failed" };

/** The organiser's season with every match (GET /seasons/:org/:season). */
export async function loadSeason(seasonId: string): Promise<SeasonLoad> {
  const session = await auth();
  const locale = await getLocale();
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/seasons/${session?.activeOrganisation.organisationId}/${seasonId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user.accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        cache: "no-store",
      },
    );
    if (request.status === 403) return { status: "forbidden" };
    const body = await request.json().catch(() => null);
    if (!request.ok || !body?.season) return { status: "failed" };
    return {
      status: "ok",
      season: body.season,
      matches: body.matches ?? [],
      passTypes: body.passTypes ?? [],
      printedBatches: body.printedBatches ?? [],
    };
  } catch {
    return { status: "failed" };
  }
}
