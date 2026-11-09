/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { revalidatePath } from "next/cache";
import { Match, Season } from "@ticketwaze/typescript-config";
import { auth } from "@/lib/auth";

/**
 * Server actions for seasons (docs/match-events-plan.md). Matches themselves
 * are created through `CreateInPersonEvent` with the season and team fields on
 * the same form; only the match-only fields (teams, logos, round) are edited
 * here.
 */

type Failed = { status: "failed"; error: string; code?: string };
type SeasonResult = { status: "success"; season: Season } | Failed;
type MatchResult = { status: "success"; match: Match } | Failed;
type DeleteResult = { status: "success" } | Failed;

const API = () => process.env.NEXT_PUBLIC_API_URL;

async function headers(locale: string) {
  const session = await auth();
  return {
    Authorization: `Bearer ${session?.user.accessToken ?? ""}`,
    "Accept-Language": locale,
    origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
  };
}

/** The API's message, whichever shape it came in. */
function messageOf(response: any): string {
  if (typeof response?.message === "string") return response.message;
  if (Array.isArray(response?.errors) && response.errors[0]?.message) {
    return String(response.errors[0].message);
  }
  return "An unknown error occurred";
}

async function send(
  method: "POST" | "PUT" | "DELETE",
  path: string,
  locale: string,
  body?: FormData | Record<string, unknown>,
): Promise<any> {
  try {
    const isJson = body !== undefined && !(body instanceof FormData);
    const request = await fetch(`${API()}${path}`, {
      method,
      headers: {
        ...(await headers(locale)),
        ...(isJson ? { "Content-Type": "application/json" } : {}),
      },
      body: isJson ? JSON.stringify(body) : (body as FormData | undefined),
    });
    const response = await request.json().catch(() => null);
    if (request.ok && response?.status === "success") return response;
    return {
      status: "failed",
      error: messageOf(response),
      code: response?.code,
      details: response?.details,
    };
  } catch (error: any) {
    return {
      status: "failed",
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function CreateSeason(
  organisationId: string,
  body: FormData,
  locale: string,
): Promise<SeasonResult> {
  const result = await send("POST", `/seasons/${organisationId}`, locale, body);
  if (result.status === "success") revalidatePath("/events");
  return result;
}

export async function UpdateSeason(
  organisationId: string,
  seasonId: string,
  body: FormData,
  locale: string,
): Promise<SeasonResult> {
  const result = await send(
    "PUT",
    `/seasons/${organisationId}/${seasonId}`,
    locale,
    body,
  );
  if (result.status === "success") revalidatePath("/events");
  return result;
}

export async function DeleteSeason(
  organisationId: string,
  seasonId: string,
  locale: string,
): Promise<DeleteResult> {
  const result = await send(
    "DELETE",
    `/seasons/${organisationId}/${seasonId}`,
    locale,
  );
  if (result.status === "success") revalidatePath("/events");
  return result;
}

export async function UpdateMatch(
  organisationId: string,
  /** Null for a standalone match. */
  seasonId: string | null,
  eventId: string,
  body: FormData,
  locale: string,
): Promise<MatchResult> {
  const result = await send(
    "PUT",
    seasonId
      ? `/seasons/${organisationId}/${seasonId}/matches/${eventId}`
      : `/seasons/${organisationId}/matches/${eventId}`,
    locale,
    body,
  );
  if (result.status === "success") revalidatePath("/events");
  return result;
}

/* ── Multi-match tickets (2026-11-09) ─────────────────────────────────────
   One ticket valid at two or more of the organiser's matches, configured
   from any of them (More menu). Stored as a hidden season on the API. */

export type BundleMatch = {
  eventId: string;
  title: string;
  eventName: string;
  round: string | null;
  startsAt: string | null;
  isOver: boolean;
  seasonId: string | null;
};

export type MatchBundle = {
  seasonId: string;
  name: string;
  description: string | null;
  seasonPassTypeId: string | null;
  price: number | null;
  usdPrice: number | null;
  currency: "HTG" | "USD";
  quantity: number | null;
  quantitySold: number;
  /** Tickets sold (any status): once one exists, matches cannot leave. */
  sold: number;
  matches: BundleMatch[];
};

export type MatchBundleInput = {
  name: string;
  description?: string | null;
  price: number;
  currency: "HTG" | "USD";
  /** Null = unlimited. */
  quantity: number | null;
  eventIds: string[];
};

export async function GetMatchBundle(
  organisationId: string,
  eventId: string,
  locale: string,
): Promise<
  | { status: "success"; bundle: MatchBundle | null; candidates: BundleMatch[] }
  | Failed
> {
  try {
    const request = await fetch(
      `${API()}/seasons/${organisationId}/matches/${eventId}/bundle`,
      { headers: await headers(locale), cache: "no-store" },
    );
    const response = await request.json().catch(() => null);
    if (request.ok && response?.status === "success") return response;
    return { status: "failed", error: messageOf(response) };
  } catch (error: any) {
    return {
      status: "failed",
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function SaveMatchBundle(
  organisationId: string,
  /** Null creates a new one. */
  seasonId: string | null,
  body: MatchBundleInput,
  locale: string,
): Promise<{ status: "success"; bundle: MatchBundle } | Failed> {
  const result = await send(
    seasonId ? "PUT" : "POST",
    seasonId
      ? `/seasons/${organisationId}/bundles/${seasonId}`
      : `/seasons/${organisationId}/bundles`,
    locale,
    body,
  );
  if (result.status === "success") revalidatePath("/events");
  return result;
}

export async function DeleteMatchBundle(
  organisationId: string,
  seasonId: string,
  locale: string,
): Promise<DeleteResult> {
  const result = await send(
    "DELETE",
    `/seasons/${organisationId}/bundles/${seasonId}`,
    locale,
  );
  if (result.status === "success") revalidatePath("/events");
  return result;
}
