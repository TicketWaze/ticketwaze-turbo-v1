/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { revalidatePath } from "next/cache";

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

async function send(
  url: string,
  method: string,
  accessToken: string,
  locale: string,
  body?: unknown,
) {
  try {
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
  accessToken: string,
  locale: string,
) {
  return send(base(organisationId, restaurantId), "POST", accessToken, locale);
}

/**
 * Closing freezes the day's figures. The API refuses while any tab is still
 * open and says which ones — that refusal is the point of the whole model.
 */
export async function CloseServiceDay(
  organisationId: string,
  restaurantId: string,
  serviceDayId: string,
  accessToken: string,
  locale: string,
  payload: { note?: string },
) {
  return send(
    `${base(organisationId, restaurantId)}/${serviceDayId}/close`,
    "POST",
    accessToken,
    locale,
    payload,
  );
}
