"use server";

/**
 * Failures carry the API's `code` alongside its `message`. The message is
 * localized copy for ordinary errors, but a refusal for account suspension
 * arrives as a developer-facing English sentence plus `code:
 * "ACCOUNT_SUSPENDED"` — the caller matches on the code and renders its own
 * translation, so the code has to survive this layer.
 */

export async function FreeEventTicket(
  accessToken: string,
  eventId: string,
  body: unknown,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/payments/free`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        body: JSON.stringify(body),
      },
    );
    const data = await res.json();

    if (data.status === "success") {
      return {
        status: "success",
      };
    } else {
      return {
        status: "failed",
        message: data.message,
        code: data.code,
      };
    }
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

export async function StartRaffleStripe(
  accessToken: string,
  raffleId: string,
  quantity: number,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/raffles/${raffleId}/entries/stripe`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        body: JSON.stringify({ quantity }),
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      return { status: "success" as const, clientSecret: data.clientSecret };
    }
    return { status: "failed" as const, message: data.message, code: data.code };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

type Guest = { firstName: string; lastName: string; email: string };

export async function StartRaffleGuestStripe(
  raffleId: string,
  quantity: number,
  guest: Guest,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/guest/raffles/${raffleId}/entries/stripe`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        body: JSON.stringify({ quantity, guest }),
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      return { status: "success" as const, clientSecret: data.clientSecret };
    }
    return { status: "failed" as const, message: data.message, code: data.code };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

export async function StartRaffleGuestMoncash(
  raffleId: string,
  quantity: number,
  guest: Guest,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/guest/raffles/${raffleId}/entries/moncash`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        body: JSON.stringify({ quantity, guest }),
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      return { status: "success" as const, paymentURL: data.paymentURL };
    }
    return { status: "failed" as const, message: data.message, code: data.code };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

export async function StartRaffleMoncash(
  accessToken: string,
  raffleId: string,
  quantity: number,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/raffles/${raffleId}/entries/moncash`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        body: JSON.stringify({ quantity }),
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      return { status: "success" as const, paymentURL: data.paymentURL };
    }
    return { status: "failed" as const, message: data.message, code: data.code };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

export async function StartRaffleGuestNatcash(
  raffleId: string,
  quantity: number,
  guest: Guest,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/guest/raffles/${raffleId}/entries/natcash`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        body: JSON.stringify({ quantity, guest }),
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      return { status: "success" as const, paymentURL: data.paymentURL };
    }
    return { status: "failed" as const, message: data.message, code: data.code };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

export async function StartRaffleNatcash(
  accessToken: string,
  raffleId: string,
  quantity: number,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/raffles/${raffleId}/entries/natcash`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        body: JSON.stringify({ quantity }),
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      return { status: "success" as const, paymentURL: data.paymentURL };
    }
    return { status: "failed" as const, message: data.message, code: data.code };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

export async function BuyRaffleEntriesWallet(
  accessToken: string,
  raffleId: string,
  quantity: number,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/raffles/${raffleId}/entries/wallet`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        body: JSON.stringify({ quantity }),
      },
    );
    const data = await res.json();

    if (data.status === "success") {
      return { status: "success" as const };
    } else {
      return { status: "failed" as const, message: data.message, code: data.code };
    }
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

/* ── Digital products ──────────────────────────────────────────────────────
   One product, one purchase, so none of these carry a quantity. The buyer
   total is computed server-side from the sale's own price — nothing here
   sends an amount, because a client-supplied total is a client-chosen price. */

export async function BuySaleWallet(
  accessToken: string,
  saleId: string,
  locale: string,
) {
  return startSalePayment("wallet", accessToken, saleId, locale);
}

export async function StartSaleStripe(
  accessToken: string,
  saleId: string,
  locale: string,
) {
  return startSalePayment("stripe", accessToken, saleId, locale);
}

export async function StartSaleMoncash(
  accessToken: string,
  saleId: string,
  locale: string,
) {
  return startSalePayment("moncash", accessToken, saleId, locale);
}

export async function StartSaleNatcash(
  accessToken: string,
  saleId: string,
  locale: string,
) {
  return startSalePayment("natcash", accessToken, saleId, locale);
}

/**
 * The four purchase methods differ only in their path and what comes back:
 * wallet settles immediately, Stripe returns a client secret for the embedded
 * form, and the two mobile wallets return a URL to hand the buyer off to.
 *
 * The API's message is passed through rather than replaced — "you already own
 * this" and "this product is priced in USD" both need to reach the buyer
 * verbatim, and a generic failure toast would hide them.
 */
async function startSalePayment(
  method: "wallet" | "stripe" | "moncash" | "natcash",
  accessToken: string,
  saleId: string,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/sales/${saleId}/buy/${method}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      return {
        status: "success" as const,
        clientSecret: data.clientSecret as string | undefined,
        paymentURL: data.paymentURL as string | undefined,
      };
    }
    return { status: "failed" as const, message: data.message as string };
  } catch (err: unknown) {
    return {
      status: "failed" as const,
      message: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

/** Settle a Stripe product purchase from the return page. */
export async function FinishSaleStripe(
  accessToken: string,
  sessionId: string,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/sales/stripe/finish/${sessionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        cache: "no-store",
      },
    );
    const data = await res.json();
    return data.status === "success"
      ? { status: "success" as const }
      : { status: "failed" as const, message: data.message as string };
  } catch (err: unknown) {
    return {
      status: "failed" as const,
      message: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

/** Mint a fresh download URL. Short-lived, so it is fetched per click. */
export async function GetSaleDownloadUrl(
  entitlementId: string,
  accessToken?: string,
  guestToken?: string,
) {
  try {
    const query = guestToken ? `?token=${encodeURIComponent(guestToken)}` : "";
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/sale-downloads/${entitlementId}${query}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        cache: "no-store",
      },
    );
    const data = await res.json();
    return data.status === "success"
      ? { status: "success" as const, url: data.url as string }
      : { status: "failed" as const, message: data.message as string };
  } catch (err: unknown) {
    return {
      status: "failed" as const,
      message: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}
