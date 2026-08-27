/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

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

/**
 * A tab opens with its first order on it — the API rejects an empty one, so the
 * dialog collects the items before it ever calls this.
 */
export async function OpenTab(
  organisationId: string,
  restaurantId: string,
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
    locale,
    payload,
  );
}

export async function UpdateTab(
  organisationId: string,
  restaurantId: string,
  tabId: string,
  locale: string,
  payload: { label: string; note?: string },
) {
  return send(
    `${base(organisationId, restaurantId)}/${tabId}`,
    "PUT",
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
  locale: string,
  search: string,
) {
  return send(
    `${creditsBase(organisationId, restaurantId)}?search=${encodeURIComponent(search)}`,
    "GET",
    locale,
  );
}

/** A float left deliberately, with no check involved. */
export async function DepositCustomerCredit(
  organisationId: string,
  restaurantId: string,
  locale: string,
  payload: { customerName: string; amount: number; note?: string },
) {
  return send(
    creditsBase(organisationId, restaurantId),
    "POST",
    locale,
    payload,
  );
}

/** Reopening clears the settlement — see the API, the old payment no longer matches. */
export async function ReopenTab(
  organisationId: string,
  restaurantId: string,
  tabId: string,
  locale: string,
) {
  return send(
    `${base(organisationId, restaurantId)}/${tabId}/reopen`,
    "PATCH",
    locale,
  );
}

export async function DeleteTab(
  organisationId: string,
  restaurantId: string,
  tabId: string,
  locale: string,
) {
  return send(
    `${base(organisationId, restaurantId)}/${tabId}`,
    "DELETE",
    locale,
  );
}

/** Only an id and a quantity — the API reads the price off the catalogue. */
export async function AddTabItem(
  organisationId: string,
  restaurantId: string,
  tabId: string,
  locale: string,
  payload: { itemId: string; quantity?: number },
) {
  return send(
    `${base(organisationId, restaurantId)}/${tabId}/items`,
    "POST",
    locale,
    payload,
  );
}

export async function UpdateTabItem(
  organisationId: string,
  restaurantId: string,
  tabId: string,
  tabItemId: string,
  locale: string,
  quantity: number,
) {
  return send(
    `${base(organisationId, restaurantId)}/${tabId}/items/${tabItemId}`,
    "PUT",
    locale,
    { quantity },
  );
}

export async function RemoveTabItem(
  organisationId: string,
  restaurantId: string,
  tabId: string,
  tabItemId: string,
  locale: string,
) {
  return send(
    `${base(organisationId, restaurantId)}/${tabId}/items/${tabItemId}`,
    "DELETE",
    locale,
  );
}
