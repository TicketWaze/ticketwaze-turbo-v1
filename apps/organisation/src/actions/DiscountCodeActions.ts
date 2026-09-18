"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

/**
 * The access token, read at call time rather than captured at render.
 *
 * Same reasoning as `EventActions.sessionToken`: an access token lives fifteen
 * minutes and a screen someone works in outlives that, so a token captured by
 * `useSession()` on mount comes back as a 401 mid-session.
 */
async function sessionToken(): Promise<string> {
  const session = await auth();
  return session?.user.accessToken ?? "";
}

/**
 * DISCOUNT CODES, AGAINST THE ACTIVITY-SCOPED API.
 *
 * Moved out of `EventActions` when codes moved off events and onto the
 * activity core, so raffles and digital products can carry them on the same
 * terms. The endpoints changed shape at the same time and for good reasons:
 *
 *   - Activating and deactivating are a PATCH. They were GETs that mutated
 *     state, which a link prefetcher can fire without anyone clicking.
 *   - Listing is authorized. The old route was behind auth and nothing else,
 *     so any signed-in account could read any organisation's codes.
 *
 * `activityId` is an event id, a raffle id or a sale id — they are the same
 * identifier by construction.
 */

interface ActionResult {
  status?: "success";
  error?: string;
  /** Set when the API refused for a reason worth showing verbatim. */
  reason?: string;
}

async function call(
  path: string,
  init: { method: string; body?: unknown },
  locale: string,
): Promise<{ ok: boolean; body: Record<string, unknown> }> {
  const accessToken = await sessionToken();
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/activities/${path}`,
    {
      method: init.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": locale,
        origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
      },
      ...(init.body === undefined
        ? {}
        : { body: JSON.stringify(init.body) }),
    },
  );
  // A refusal carries copy the API already localized; a crash may carry no
  // body at all, so the parse must not be what fails.
  const body = await request.json().catch(() => ({}));
  return { ok: request.ok, body };
}

export async function CreateDiscountCode(
  activityId: string,
  data: unknown,
  pathname: string,
  locale: string,
): Promise<ActionResult> {
  try {
    const { ok, body } = await call(
      `${activityId}/discount-codes`,
      { method: "POST", body: data },
      locale,
    );
    if (!ok) throw new Error(String(body.message ?? "Could not create the code."));
    revalidatePath(pathname);
    return { status: "success" };
  } catch (error) {
    return { error: (error as Error)?.message ?? "An unknown error occurred" };
  }
}

export async function UpdateDiscountCode(
  activityId: string,
  discountCodeId: string,
  data: unknown,
  pathname: string,
  locale: string,
): Promise<ActionResult> {
  try {
    const { ok, body } = await call(
      `${activityId}/discount-codes/${discountCodeId}`,
      { method: "PATCH", body: data },
      locale,
    );
    if (!ok) throw new Error(String(body.message ?? "Could not update the code."));
    revalidatePath(pathname);
    return { status: "success" };
  } catch (error) {
    return { error: (error as Error)?.message ?? "An unknown error occurred" };
  }
}

/**
 * One call for both directions, where there used to be two GET routes.
 * `isActive` is the state being moved TO, not a toggle — a toggle would flip
 * the wrong way on a stale render.
 */
export async function SetDiscountCodeActive(
  activityId: string,
  discountCodeId: string,
  isActive: boolean,
  pathname: string,
  locale: string,
): Promise<ActionResult> {
  try {
    const { ok, body } = await call(
      `${activityId}/discount-codes/${discountCodeId}/active`,
      { method: "PATCH", body: { isActive } },
      locale,
    );
    if (!ok) throw new Error(String(body.message ?? "Could not update the code."));
    revalidatePath(pathname);
    return { status: "success" };
  } catch (error) {
    return { error: (error as Error)?.message ?? "An unknown error occurred" };
  }
}

/**
 * Delete a code.
 *
 * A code that has ever been used is DEACTIVATED instead — its redemptions are
 * part of how past orders were priced. The API decides which happened and says
 * so; the caller shows that message rather than assuming it was deleted.
 */
export async function DeleteDiscountCode(
  activityId: string,
  discountCodeId: string,
  pathname: string,
  locale: string,
): Promise<ActionResult & { deleted?: boolean; message?: string }> {
  try {
    const { ok, body } = await call(
      `${activityId}/discount-codes/${discountCodeId}`,
      { method: "DELETE" },
      locale,
    );
    if (!ok) throw new Error(String(body.message ?? "Could not delete the code."));
    revalidatePath(pathname);
    return {
      status: "success",
      deleted: body.deleted === true,
      message: body.message as string | undefined,
    };
  } catch (error) {
    return { error: (error as Error)?.message ?? "An unknown error occurred" };
  }
}
