"use client";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { RecipientCheck } from "../saleCheckout.types";

/**
 * STEP 2 — WHO IS THIS FOR.
 *
 * The product counterpart of the event flow's recipient step, and the same
 * idea: buying for somebody else is a decision made before payment, not a
 * surprise at the end.
 *
 * It differs in one way that is forced by the goods. An event ticket can be
 * assigned to any name and email, because the ticket itself is the credential.
 * A digital product grants a permanent entitlement to an ACCOUNT, so the
 * recipient must have one — there is nobody to grant it to otherwise. That is
 * why this step verifies the address as it is typed rather than simply
 * collecting it, and why it can offer an invitation when there is no account.
 */
export default function SaleRecipientStep({
  delta,
  isGift,
  onToggleGift,
  recipientEmail,
  onRecipientEmailChange,
  recipientCheck,
  isChecking,
  inviteSent,
  onInvite,
  isInviting,
}: {
  delta: number;
  isGift: boolean;
  onToggleGift: (next: boolean) => void;
  recipientEmail: string;
  onRecipientEmailChange: (value: string) => void;
  recipientCheck: RecipientCheck | null;
  isChecking: boolean;
  inviteSent: boolean;
  onInvite: () => void;
  isInviting: boolean;
}) {
  const t = useTranslations("Sale");

  return (
    <motion.div
      initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex flex-col gap-8 lg:h-full lg:min-h-0 lg:overflow-y-auto"
    >
      <div className="flex flex-col gap-6 rounded-[15px] border border-neutral-100 p-6">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[1.5rem] leading-8 text-neutral-900">
            {t("gift.forSomeoneElse")}
          </span>
          <label className="relative inline-block h-12 w-20 shrink-0 cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={isGift}
              onChange={(e) => onToggleGift(e.target.checked)}
            />
            <span className="absolute inset-y-0 start-0 m-1 size-10 rounded-full bg-white transition-all peer-checked:start-8" />
          </label>
        </div>

        {!isGift && (
          <span className="text-[1.4rem] leading-8 text-neutral-600">
            {t("gift.keepingItNote")}
          </span>
        )}

        {isGift && (
          <div className="flex flex-col gap-4">
            <span className="text-[1.4rem] leading-8 text-neutral-600">
              {t("gift.accountRequired")}
            </span>

            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => onRecipientEmailChange(e.target.value)}
              placeholder={t("gift.emailPlaceholder")}
              className="bg-neutral-100 w-full rounded-[15px] px-6 py-5 text-[1.5rem] leading-8 text-deep-200 outline-none border border-transparent focus:border-primary-500"
            />

            {isChecking && (
              <span className="text-[1.4rem] leading-8 text-neutral-600">
                {t("gift.checking")}
              </span>
            )}

            {!isChecking && recipientCheck?.canReceive && (
              <span className="text-[1.4rem] leading-8 text-[#16A34A]">
                {t("gift.willBeSentTo", {
                  name: recipientCheck.firstName ?? "",
                })}
              </span>
            )}

            {!isChecking && recipientCheck && !recipientCheck.canReceive && (
              <div className="flex flex-col gap-3">
                <span className="text-[1.4rem] leading-8 text-failure">
                  {recipientCheck.message ?? t("gift.cannotReceive")}
                </span>
                {/*
                  Offered ONLY when the address has no account. An address that
                  already has one is a different problem, and the API refuses to
                  mail existing users from here.
                */}
                {!recipientCheck.found && (
                  <button
                    type="button"
                    onClick={onInvite}
                    disabled={inviteSent || isInviting}
                    className="text-[1.4rem] leading-8 text-primary-500 text-left disabled:text-neutral-500"
                  >
                    {inviteSent ? t("gift.inviteSent") : t("gift.invite")}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
