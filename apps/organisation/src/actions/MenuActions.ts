/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { revalidatePath } from "next/cache";

/**
 * Menu CRUD for the workplace. Every route is scoped by organisation AND
 * restaurant — the API re-checks that link on each call rather than trusting the
 * URL, so these mirror that shape exactly.
 */
function base(organisationId: string, restaurantId: string) {
  return `${process.env.NEXT_PUBLIC_API_URL}/restaurants/${organisationId}/${restaurantId}/menus`;
}

function headers(accessToken: string, locale: string, json = true) {
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
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
    const isFormData = body instanceof FormData;
    const request = await fetch(url, {
      method,
      headers: headers(accessToken, locale, !isFormData),
      body: isFormData
        ? body
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
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

export async function CreateMenu(
  organisationId: string,
  restaurantId: string,
  accessToken: string,
  locale: string,
  payload: {
    name: string;
    description?: string;
    servesFrom?: string;
    servesUntil?: string;
  },
) {
  return send(
    base(organisationId, restaurantId),
    "POST",
    accessToken,
    locale,
    payload,
  );
}

export async function UpdateMenu(
  organisationId: string,
  restaurantId: string,
  menuId: string,
  accessToken: string,
  locale: string,
  payload: {
    name: string;
    description?: string;
    servesFrom?: string;
    servesUntil?: string;
    isActive?: boolean;
  },
) {
  return send(
    `${base(organisationId, restaurantId)}/${menuId}`,
    "PUT",
    accessToken,
    locale,
    payload,
  );
}

export async function DeleteMenu(
  organisationId: string,
  restaurantId: string,
  menuId: string,
  accessToken: string,
  locale: string,
) {
  return send(
    `${base(organisationId, restaurantId)}/${menuId}`,
    "DELETE",
    accessToken,
    locale,
  );
}

export async function CreateSection(
  organisationId: string,
  restaurantId: string,
  menuId: string,
  accessToken: string,
  locale: string,
  payload: { name: string; description?: string },
) {
  return send(
    `${base(organisationId, restaurantId)}/${menuId}/sections`,
    "POST",
    accessToken,
    locale,
    payload,
  );
}

export async function UpdateSection(
  organisationId: string,
  restaurantId: string,
  sectionId: string,
  accessToken: string,
  locale: string,
  payload: { name: string; description?: string },
) {
  return send(
    `${base(organisationId, restaurantId)}/sections/${sectionId}`,
    "PUT",
    accessToken,
    locale,
    payload,
  );
}

export async function DeleteSection(
  organisationId: string,
  restaurantId: string,
  sectionId: string,
  accessToken: string,
  locale: string,
) {
  return send(
    `${base(organisationId, restaurantId)}/sections/${sectionId}`,
    "DELETE",
    accessToken,
    locale,
  );
}

/**
 * The workplace catalogue. The venue picks "food" or "drink" and adds the dish;
 * the menu and section it lands in are the API's problem, not the user's. These
 * write to the same tables as the menu routes above, so the public page is
 * unaffected.
 *
 * Plain JSON, not FormData — a catalogue entry carries no photo.
 */
function catalogBase(organisationId: string, restaurantId: string) {
  return `${process.env.NEXT_PUBLIC_API_URL}/restaurants/${organisationId}/${restaurantId}/items`;
}

export interface CatalogItemPayload {
  name: string;
  description: string;
  price: number;
  currency: "HTG" | "USD";
  category: "food" | "drink";
}

export async function CreateCatalogItem(
  organisationId: string,
  restaurantId: string,
  accessToken: string,
  locale: string,
  payload: CatalogItemPayload,
) {
  return send(
    catalogBase(organisationId, restaurantId),
    "POST",
    accessToken,
    locale,
    payload,
  );
}

export async function UpdateCatalogItem(
  organisationId: string,
  restaurantId: string,
  itemId: string,
  accessToken: string,
  locale: string,
  payload: CatalogItemPayload,
) {
  return send(
    `${catalogBase(organisationId, restaurantId)}/${itemId}`,
    "PUT",
    accessToken,
    locale,
    payload,
  );
}

/** Items go as FormData — an item may carry a photo. */
export async function CreateItem(
  organisationId: string,
  restaurantId: string,
  sectionId: string,
  accessToken: string,
  locale: string,
  body: FormData,
) {
  return send(
    `${base(organisationId, restaurantId)}/sections/${sectionId}/items`,
    "POST",
    accessToken,
    locale,
    body,
  );
}

export async function UpdateItem(
  organisationId: string,
  restaurantId: string,
  itemId: string,
  accessToken: string,
  locale: string,
  body: FormData,
) {
  return send(
    `${base(organisationId, restaurantId)}/items/${itemId}`,
    "PUT",
    accessToken,
    locale,
    body,
  );
}

export async function DeleteItem(
  organisationId: string,
  restaurantId: string,
  itemId: string,
  accessToken: string,
  locale: string,
) {
  return send(
    `${base(organisationId, restaurantId)}/items/${itemId}`,
    "DELETE",
    accessToken,
    locale,
  );
}

/**
 * The nightly "86'd" switch. Its own endpoint with a single field so a cook
 * flipping an item off cannot clobber an edit someone else made meanwhile.
 */
export async function ToggleItemAvailability(
  organisationId: string,
  restaurantId: string,
  itemId: string,
  accessToken: string,
  locale: string,
  isAvailable: boolean,
) {
  return send(
    `${base(organisationId, restaurantId)}/items/${itemId}/availability`,
    "PATCH",
    accessToken,
    locale,
    { isAvailable },
  );
}
