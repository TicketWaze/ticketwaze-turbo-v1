/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { revalidatePath } from "next/cache";

/**
 * Customer tabs — the running checks the workplace keeps while guests are still
 * in the venue. Scoped by organisation AND restaurant, mirroring the API, which
 * re-checks that link on every call rather than trusting the URL.
 */
function base(organisationId: string, restaurantId: string) {
  return `${process.env.NEXT_PUBLIC_API_URL}/restaurants/${organisationId}/${restaurantId}/tabs`;
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

/**
 * A tab opens with its first order on it — the API rejects an empty one, so the
 * dialog collects the items before it ever calls this.
 */
export async function OpenTab(
  organisationId: string,
  restaurantId: string,
  accessToken: string,
  locale: string,
  payload: {
    label: string;
    note?: string;
    items: { itemId: string; quantity: number }[];
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

export async function UpdateTab(
  organisationId: string,
  restaurantId: string,
  tabId: string,
  accessToken: string,
  locale: string,
  payload: { label: string; note?: string },
) {
  return send(
    `${base(organisationId, restaurantId)}/${tabId}`,
    "PUT",
    accessToken,
    locale,
    payload,
  );
}

/**
 * Close the tab by taking payment — at a counter those are the same act. The
 * change is computed server-side; the client only says what was handed over.
 */
export async function SettleTab(
  organisationId: string,
  restaurantId: string,
  tabId: string,
  accessToken: string,
  locale: string,
  payload: {
    paymentMethod: "cash";
    amountTendered: number;
    /** Required by the API whenever credit is taken or left. */
    customerName?: string;
    /** Balance to draw down. The API re-reads the real balance and caps it. */
    creditApplied?: number;
    /** Keep the change on the guest's balance instead of handing it over. */
    keepChangeAsCredit?: boolean;
  },
) {
  return send(
    `${base(organisationId, restaurantId)}/${tabId}/settle`,
    "POST",
    accessToken,
    locale,
    payload,
  );
}

/**
 * Money the venue holds for named guests.
 *
 * Sits on its own path rather than under `/tabs`, because a balance outlives
 * any one check — it is created on one visit and spent on another.
 */
function creditsBase(organisationId: string, restaurantId: string) {
  return `${process.env.NEXT_PUBLIC_API_URL}/restaurants/${organisationId}/${restaurantId}/credits`;
}

/** Find guests by name, to spend a balance against the check being settled. */
export async function SearchCustomerCredits(
  organisationId: string,
  restaurantId: string,
  accessToken: string,
  locale: string,
  search: string,
) {
  return send(
    `${creditsBase(organisationId, restaurantId)}?search=${encodeURIComponent(search)}`,
    "GET",
    accessToken,
    locale,
  );
}

/** A float left deliberately, with no check involved. */
export async function DepositCustomerCredit(
  organisationId: string,
  restaurantId: string,
  accessToken: string,
  locale: string,
  payload: { customerName: string; amount: number; note?: string },
) {
  return send(
    creditsBase(organisationId, restaurantId),
    "POST",
    accessToken,
    locale,
    payload,
  );
}

/** Reopening clears the settlement — see the API, the old payment no longer matches. */
export async function ReopenTab(
  organisationId: string,
  restaurantId: string,
  tabId: string,
  accessToken: string,
  locale: string,
) {
  return send(
    `${base(organisationId, restaurantId)}/${tabId}/reopen`,
    "PATCH",
    accessToken,
    locale,
  );
}

export async function DeleteTab(
  organisationId: string,
  restaurantId: string,
  tabId: string,
  accessToken: string,
  locale: string,
) {
  return send(
    `${base(organisationId, restaurantId)}/${tabId}`,
    "DELETE",
    accessToken,
    locale,
  );
}

/** Only an id and a quantity — the API reads the price off the catalogue. */
export async function AddTabItem(
  organisationId: string,
  restaurantId: string,
  tabId: string,
  accessToken: string,
  locale: string,
  payload: { itemId: string; quantity?: number },
) {
  return send(
    `${base(organisationId, restaurantId)}/${tabId}/items`,
    "POST",
    accessToken,
    locale,
    payload,
  );
}

export async function UpdateTabItem(
  organisationId: string,
  restaurantId: string,
  tabId: string,
  tabItemId: string,
  accessToken: string,
  locale: string,
  quantity: number,
) {
  return send(
    `${base(organisationId, restaurantId)}/${tabId}/items/${tabItemId}`,
    "PUT",
    accessToken,
    locale,
    { quantity },
  );
}

export async function RemoveTabItem(
  organisationId: string,
  restaurantId: string,
  tabId: string,
  tabItemId: string,
  accessToken: string,
  locale: string,
) {
  return send(
    `${base(organisationId, restaurantId)}/${tabId}/items/${tabItemId}`,
    "DELETE",
    accessToken,
    locale,
  );
}
