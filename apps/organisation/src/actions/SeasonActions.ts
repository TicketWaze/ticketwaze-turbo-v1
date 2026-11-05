/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { revalidatePath } from "next/cache";
import { Match, Season, SeasonPassType } from "@ticketwaze/typescript-config";
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
type PassTypeResult =
  | { status: "success"; passType: SeasonPassType }
  | (Failed & { details?: Record<string, unknown> });

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
  seasonId: string,
  eventId: string,
  body: FormData,
  locale: string,
): Promise<MatchResult> {
  const result = await send(
    "PUT",
    `/seasons/${organisationId}/${seasonId}/matches/${eventId}`,
    locale,
    body,
  );
  if (result.status === "success") revalidatePath("/events");
  return result;
}

export type PassTypeInput = {
  name: string;
  description: string | null;
  price: number;
  currency: "HTG" | "USD";
  quantity: number;
  /** One per upcoming match: the ticket type its holders sit in. */
  mappings: { eventId: string; eventTicketTypeId: string }[];
};

/** Creates a pass type, or edits one when `passTypeId` is given. */
export async function SavePassType(
  organisationId: string,
  seasonId: string,
  input: PassTypeInput,
  locale: string,
  passTypeId?: string,
): Promise<PassTypeResult> {
  const base = `/seasons/${organisationId}/${seasonId}/passes`;
  const result = await send(
    passTypeId ? "PUT" : "POST",
    passTypeId ? `${base}/${passTypeId}` : base,
    locale,
    input,
  );
  if (result.status === "success") revalidatePath("/events");
  return result;
}

export async function DeletePassType(
  organisationId: string,
  seasonId: string,
  passTypeId: string,
  locale: string,
): Promise<DeleteResult> {
  const result = await send(
    "DELETE",
    `/seasons/${organisationId}/${seasonId}/passes/${passTypeId}`,
    locale,
  );
  if (result.status === "success") revalidatePath("/events");
  return result;
}
