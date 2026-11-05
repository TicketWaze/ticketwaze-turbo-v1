"use server";
import { auth } from "@/lib/auth";

/**
 * Season pass checkout (docs/match-events-plan.md, phase 4). Every total is
 * priced by the API (`quote`, then the payment itself); nothing here computes
 * a fee.
 */

type Guest = { firstName: string; lastName: string; email: string };
type Failed = { status: "failed"; message?: string; code?: string };

const API = () => process.env.NEXT_PUBLIC_API_URL;

async function call(
  method: "GET" | "POST",
  path: string,
  locale: string,
  body?: unknown,
  signedIn = true,
) {
  const session = signedIn ? await auth() : null;
  try {
    const res = await fetch(`${API()}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": locale,
        origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        ...(session?.user?.accessToken
          ? { Authorization: `Bearer ${session.user.accessToken}` }
          : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    return await res.json().catch(() => ({ status: "failed" }));
  } catch (err: unknown) {
    return {
      status: "failed",
      message: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

export type PassQuote = {
  status: "success";
  quantity: number;
  currency: "HTG" | "USD";
  base: { htg: number; usd: number };
  wallet: { htg: number; usd: number };
  card: { htg: number; usd: number };
  moncash: { htg: number; usd: number };
  natcash: { htg: number; usd: number };
  remaining: number;
};

/** What `quantity` passes cost by each method, for this buyer. */
export async function QuoteSeasonPass(
  passTypeId: string,
  quantity: number,
  locale: string,
): Promise<PassQuote | Failed> {
  return call(
    "GET",
    `/season-passes/${passTypeId}/quote?quantity=${quantity}`,
    locale,
  );
}

export async function BuySeasonPassWallet(
  passTypeId: string,
  quantity: number,
  locale: string,
): Promise<{ status: "success"; orderId: string } | Failed> {
  return call("POST", `/season-passes/${passTypeId}/payments/wallet`, locale, {
    quantity,
  });
}

/** Stripe (embedded) or a mobile wallet, signed in or as a guest. */
export async function StartSeasonPassPayment(
  passTypeId: string,
  method: "stripe" | "moncash" | "natcash",
  quantity: number,
  locale: string,
  guest?: Guest,
): Promise<
  | { status: "success"; clientSecret?: string; paymentURL?: string }
  | (Failed & { accountExists?: boolean })
> {
  return guest
    ? call(
        "POST",
        `/guest/season-passes/${passTypeId}/payments/${method}`,
        locale,
        { quantity, guest },
        false,
      )
    : call("POST", `/season-passes/${passTypeId}/payments/${method}`, locale, {
        quantity,
      });
}

/** The Stripe return: records the passes once the session is paid. */
export async function FinishSeasonPassStripe(
  sessionId: string,
  locale: string,
  asGuest: boolean,
): Promise<{
  status: "success" | "duplicate" | "failed";
  code?: string;
  season?: { seasonId: string; name: string };
}> {
  return asGuest
    ? call(
        "GET",
        `/guest/season-passes/stripe/finish/${sessionId}`,
        locale,
        undefined,
        false,
      )
    : call("GET", `/season-passes/stripe/finish/${sessionId}`, locale);
}

