"use client";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowRight2, UserOctagon } from "iconsax-reactjs";
import { Link } from "@/i18n/navigation";
import { DialogClose, DialogContent } from "@/components/ui/dialog";
import { NoAuthPrompt } from "@/components/Layouts/NoAuthDialog";
import { authHref } from "@/lib/authRedirect";

/**
 * Signed-out "Buy" dialog: Figma's "Complete Purchase" prompt (Cancel /
 * Proceed to sign in, then back to checkout), plus the app's guest checkout.
 */
export default function BuyTicketAuthDialog({
  checkoutUrl,
  isPrivate = false,
  isOnline = false,
}: {
  checkoutUrl: string;
  isPrivate?: boolean;
  /**
   * An online activity (`eventCategory === 'meet'`, either provider). Guest
   * checkout is closed for these: attending means a calendar invite and a call
   * to join, which need an account to attach to. The API refuses it too.
   */
  isOnline?: boolean;
}) {
  const t = useTranslations("Event.buyDialog");
  const tPrompt = useTranslations("Layout.prompt");
  // Guest checkout is closed for private activities (buyers must sign in with
  // the invited account email) and for online ones (see `isOnline`).
  const allowGuest = !isPrivate && !isOnline;

  return (
    <DialogContent
      showCloseButton={false}
      className="gap-0 max-h-[90vh] overflow-y-auto"
    >
      <NoAuthPrompt
        title={tPrompt("purchase.title")}
        description={tPrompt("purchase.description")}
      >
        <div className="flex gap-6 w-full">
          <DialogClose className="flex-1 h-[6rem] px-8 rounded-[10rem] border-2 border-primary-400 bg-primary-50 text-primary-500 text-[1.6rem] cursor-pointer transition-all duration-200 hover:bg-primary-100 active:scale-95">
            {tPrompt("cancel")}
          </DialogClose>
          <Link
            href={authHref("/auth/login", checkoutUrl)}
            className="flex-1 h-[6rem] px-8 rounded-[10rem] border-2 border-primary-500 bg-primary-500 text-white font-semibold text-[1.6rem] flex items-center justify-center transition-all duration-200 hover:bg-primary-500/85 active:scale-95"
          >
            {tPrompt("proceed")}
          </Link>
        </div>

        {isPrivate && (
          <p className="text-[1.4rem] leading-7 text-neutral-600 text-center">
            {t("private_note")}
          </p>
        )}
        {/* Said only when it is the reason: a private online activity is
            already explained by the note above. */}
        {isOnline && !isPrivate && (
          <p className="text-[1.4rem] leading-7 text-neutral-600 text-center">
            {t("online_note")}
          </p>
        )}

        {allowGuest && (
          <>
            <p className="text-[1.6rem] leading-8 text-neutral-700 text-center">
              {t("or")}
            </p>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={checkoutUrl}
                className="flex items-center justify-between gap-4 p-6 rounded-[20px] bg-neutral-100 border border-transparent hover:border-primary-200 transition-colors duration-300 text-left"
              >
                <span className="flex items-center gap-6">
                  <UserOctagon
                    size={25}
                    color="#454A53"
                    variant="Bulk"
                    className="shrink-0"
                  />
                  <span className="flex flex-col gap-2">
                    <span className="font-primary font-medium text-[1.8rem] leading-10 text-neutral-900">
                      {t("guest")}
                    </span>
                    <span className="text-[1.5rem] leading-8 text-neutral-500">
                      {t("guest_description")}
                    </span>
                  </span>
                </span>
                <ArrowRight2
                  size={20}
                  color="#737C8A"
                  variant="Bulk"
                  className="shrink-0"
                />
              </Link>
            </motion.div>
          </>
        )}
      </NoAuthPrompt>
    </DialogContent>
  );
}
