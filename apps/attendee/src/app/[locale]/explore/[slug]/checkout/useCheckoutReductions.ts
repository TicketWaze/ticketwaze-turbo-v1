"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import type {
  AppliedDiscount,
  DiscountRefusalReason,
  TokenBalance,
} from "./checkout.types";

/**
 * THE BUYER'S TWO WAYS OF PAYING LESS, held in one place.
 *
 * A discount code and a token balance have nothing in common mechanically —
 * one is validated against the server, the other is a slider over a number we
 * already know — but they are entered on the same screen, they both feed the
 * same fee breakdown, and both have to be cleared together when the cart
 * changes. Keeping them in one hook is what stops `CheckoutFlow` from growing
 * another eight pieces of state.
 *
 * NOTHING HERE IS TRUSTED WITH MONEY. The code and the token count are sent to
 * the payment endpoint as a request; the API re-resolves both against prices
 * and balances it reads itself. A tampered `amount` produces a wrong preview
 * and the correct charge.
 */
export function useCheckoutReductions(options: {
  activityId: string;
  /** Pre-discount subtotal, in the activity's currency. */
  subtotal: number;
  accessToken: string;
  /** Guests have no wallet, so no tokens — the code still applies to them. */
  isGuest: boolean;
}) {
  const { activityId, subtotal, accessToken, isGuest } = options;
  const locale = useLocale();

  const [discount, setDiscount] = useState<AppliedDiscount | null>(null);
  const [discountError, setDiscountError] = useState<{
    reason: DiscountRefusalReason | "network";
    message: string;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [tokens, setTokens] = useState(0);

  /**
   * Guards against a slow answer for a code the buyer has since replaced.
   *
   * Two checks in flight can land out of order, and the older one would
   * overwrite the newer — showing the buyer a discount for a code they are no
   * longer trying. Only the most recent request may write.
   */
  const requestId = useRef(0);

  const check = useCallback(
    async (raw: string) => {
      const code = raw.trim();
      if (!code) return;

      const id = ++requestId.current;
      setIsChecking(true);
      setDiscountError(null);

      try {
        const request = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/activities/${activityId}/discount-code/validate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept-Language": locale,
              // Sent when we have one, purely so a per-buyer limit can be
              // counted. The route works without it — guests use codes too.
              ...(accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {}),
            },
            body: JSON.stringify({ code, subtotal }),
          },
        );
        const response = await request.json();
        if (id !== requestId.current) return;

        if (response?.valid) {
          setDiscount({ ...response.discount });
          setDiscountError(null);
        } else {
          setDiscount(null);
          setDiscountError({
            reason: response?.reason ?? "not_found",
            message: response?.message ?? "That code is not valid.",
          });
        }
      } catch {
        if (id !== requestId.current) return;
        setDiscount(null);
        setDiscountError({
          reason: "network",
          message: "We could not check that code. Please try again.",
        });
      } finally {
        if (id === requestId.current) setIsChecking(false);
      }
    },
    [activityId, subtotal, accessToken, locale],
  );

  const clear = useCallback(() => {
    requestId.current += 1;
    setDiscount(null);
    setDiscountError(null);
    setIsChecking(false);
  }, []);

  /**
   * RE-CHECKED WHENEVER THE CART CHANGES, because the answer can change with
   * it: a code with a minimum purchase stops applying when a ticket is
   * removed, and a percentage code is worth a different amount.
   *
   * Re-checking rather than recomputing locally is deliberate — the minimum is
   * the server's rule, and quietly keeping a stale amount is how a buyer ends
   * up seeing one total and being charged another.
   */
  useEffect(() => {
    if (!discount) return;
    if (subtotal <= 0) {
      clear();
      return;
    }
    void check(discount.code);
    // `check` changes with `subtotal`, which is the dependency that matters;
    // `discount.code` guards against re-running for the same code twice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  /** The signed-in buyer's token balance, fetched once. */
  useEffect(() => {
    if (isGuest || !accessToken) return;
    let cancelled = false;

    void (async () => {
      try {
        const request = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/me/tokens`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Accept-Language": locale,
            },
          },
        );
        const response = await request.json();
        if (cancelled || response?.status !== "success") return;
        setBalance({
          tokens: Number(response.tokens) || 0,
          exchangeRate: Number(response.exchangeRate) || 0,
          value: response.value,
        });
      } catch {
        // A balance we cannot read is the same as none for this checkout: the
        // token row simply does not appear. Never fatal — the buyer can still
        // pay.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isGuest, accessToken, locale]);

  return {
    discount,
    discountError,
    isChecking,
    checkDiscount: check,
    clearDiscount: clear,
    availableTokens: balance?.tokens ?? 0,
    tokens,
    setTokens,
  };
}
