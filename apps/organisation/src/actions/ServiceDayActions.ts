/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

/**
 * Trading days. The venue decides when its day starts and ends, and every tab
 * belongs to one — that is what keeps today's takings out of tomorrow's totals.
 */
function base(organisationId: string, restaurantId: string) {
  return `${process.env.NEXT_PUBLIC_API_URL}/restaurants/${organisationId}/${restaurantId}/service-days`;
}

function headers(accessToken: string, locale: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    "Accept-Language": locale,
    origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
  };
}

/**
 * The access token, read from the session at call time.
 *
 * Never taken from the caller: the browser's copy is captured by
 * `useSession()` at mount and an access token only lives fifteen minutes, so a
 * screen someone stays and works in was sending an expired one. auth() reads
 * the session fresh and refreshes it if it is close to expiry.
 */
async function sessionToken(): Promise<string> {
  const session = await auth();
  return session?.user.accessToken ?? "";
}

async function send(
  url: string,
  method: string,
  locale: string,
  body?: unknown,
) {
  try {
    const accessToken = await sessionToken();
    const request = await fetch(url, {
      method,
      headers: headers(accessToken, locale),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const response = await request.json().catch(() => null);
    if (response?.status === "success") {
      revalidatePath("/events");
      return { status: "success", data: response };
    }
    throw new Error(response?.message ?? "Request failed");
  } catch (error: any) {
    return { error: error?.message ?? "An unknown error occurred" };
  }
}

export async function OpenServiceDay(
  organisationId: string,
  restaurantId: string,
  locale: string,
) {
  return send(base(organisationId, restaurantId), "POST", locale);
}

/**
 * Closing freezes the day's figures. The API refuses while any tab is still
 * open and says which ones — that refusal is the point of the whole model.
 */
export async function CloseServiceDay(
  organisationId: string,
  restaurantId: string,
  serviceDayId: string,
  locale: string,
  payload: { note?: string },
) {
  return send(
    `${base(organisationId, restaurantId)}/${serviceDayId}/close`,
    "POST",
    locale,
    payload,
  );
}
