"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type {
  ActivityReward,
  RewardGrant,
} from "@ticketwaze/typescript-config";

/**
 * REWARDS, AGAINST THE ACTIVITY-SCOPED API.
 *
 * Shaped like `DiscountCodeActions` next door, for the same reasons: the token
 * is read at call time rather than captured at render (an access token lives
 * fifteen minutes and this screen outlives that), and switching a reward on or
 * off is a PATCH carrying the state being moved TO — a toggle would flip the
 * wrong way on a stale render.
 *
 * There is at most one reward per activity, which is why `Get` needs no id and
 * the collection has no list endpoint.
 */

async function sessionToken(): Promise<string> {
  const session = await auth();
  return session?.user.accessToken ?? "";
}

interface ActionResult {
  status?: "success";
  error?: string;
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
      cache: "no-store",
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    },
  );
  // A refusal carries copy the API already localized; a crash may carry no
  // body at all, so the parse must not be what fails.
  const body = await request.json().catch(() => ({}));
  return { ok: request.ok, body };
}

export interface RewardState {
  reward: ActivityReward | null;
  grants: RewardGrant[];
  /** False on a free event, where a reward cannot be earned by buying. */
  canCreate: boolean;
}

export async function GetReward(
  activityId: string,
  locale: string,
): Promise<RewardState | { error: string }> {
  try {
    const { ok, body } = await call(
      `${activityId}/reward`,
      { method: "GET" },
      locale,
    );
    if (!ok) {
      // 403 is surfaced verbatim so the page can show the unauthorized view
      // rather than a generic failure.
      throw new Error(String(body.message ?? "Could not load the reward."));
    }
    return {
      reward: (body.reward as ActivityReward | null) ?? null,
      grants: (body.grants as RewardGrant[]) ?? [],
      canCreate: body.canCreate === true,
    };
  } catch (error) {
    return { error: (error as Error)?.message ?? "An unknown error occurred" };
  }
}

export async function CreateReward(
  activityId: string,
  data: { name: string; requiredQuantity: number; stock: number | null },
  pathname: string,
  locale: string,
): Promise<ActionResult> {
  try {
    const { ok, body } = await call(
      `${activityId}/reward`,
      { method: "POST", body: data },
      locale,
    );
    if (!ok)
      throw new Error(String(body.message ?? "Could not create the reward."));
    revalidatePath(pathname);
    return { status: "success" };
  } catch (error) {
    return { error: (error as Error)?.message ?? "An unknown error occurred" };
  }
}

export async function UpdateReward(
  activityId: string,
  rewardId: string,
  data: {
    name?: string;
    requiredQuantity?: number;
    stock?: number | null;
  },
  pathname: string,
  locale: string,
): Promise<ActionResult> {
  try {
    const { ok, body } = await call(
      `${activityId}/reward/${rewardId}`,
      { method: "PATCH", body: data },
      locale,
    );
    if (!ok)
      throw new Error(String(body.message ?? "Could not update the reward."));
    revalidatePath(pathname);
    return { status: "success" };
  } catch (error) {
    return { error: (error as Error)?.message ?? "An unknown error occurred" };
  }
}

/** `isActive` is the state being moved TO, not a toggle. */
export async function SetRewardActive(
  activityId: string,
  rewardId: string,
  isActive: boolean,
  pathname: string,
  locale: string,
): Promise<ActionResult> {
  try {
    const { ok, body } = await call(
      `${activityId}/reward/${rewardId}/active`,
      { method: "PATCH", body: { isActive } },
      locale,
    );
    if (!ok)
      throw new Error(String(body.message ?? "Could not update the reward."));
    revalidatePath(pathname);
    return { status: "success" };
  } catch (error) {
    return { error: (error as Error)?.message ?? "An unknown error occurred" };
  }
}

/**
 * Delete the reward.
 *
 * One that has already been given to buyers is switched off instead — its
 * grants explain why those people hold a ticket they never paid for. The API
 * decides which happened and says so; the caller shows that message rather
 * than assuming it was deleted.
 */
export async function DeleteReward(
  activityId: string,
  rewardId: string,
  pathname: string,
  locale: string,
): Promise<ActionResult & { deleted?: boolean; message?: string }> {
  try {
    const { ok, body } = await call(
      `${activityId}/reward/${rewardId}`,
      { method: "DELETE" },
      locale,
    );
    if (!ok)
      throw new Error(String(body.message ?? "Could not delete the reward."));
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
