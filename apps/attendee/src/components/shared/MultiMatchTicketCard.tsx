import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight2 } from "iconsax-reactjs";
import { formatMoney } from "@ticketwaze/currency";
import { Link } from "@/i18n/navigation";
import { slugify } from "@/lib/Slugify";

/** A club's multi-match ticket on sale (GET /explore/organisations/:id/multi-match-tickets). */
export type PublicMultiMatchTicket = {
  seasonPassTypeId: string;
  name: string;
  description: string | null;
  price: number;
  usdPrice: number;
  currency: "HTG" | "USD";
  /** Null = no limit. */
  remaining: number | null;
  matchesLeft: number;
  season: { seasonId: string; name: string };
};

/**
 * A multi-match ticket on the club's public page, so fans see it before they
 * open a match's checkout. Buying goes through the ticket's own checkout.
 */
export default async function MultiMatchTicketCard({
  ticket,
}: {
  ticket: PublicMultiMatchTicket;
}) {
  const t = await getTranslations("Season.inCheckout");
  const tCheckout = await getTranslations("Checkout");
  const locale = await getLocale();
  const soldOut = ticket.remaining !== null && ticket.remaining <= 0;
  return (
    <div className="border border-primary-500/30 bg-primary-50/40 rounded-[15px] p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold text-[1.6rem] leading-10 text-deep-100 min-w-0 break-words">
          {ticket.name}
        </span>
        <span className="rounded-[30px] bg-primary-500/10 px-4 py-1 text-[1.2rem] font-medium text-primary-500 whitespace-nowrap">
          {t("matches", { count: ticket.matchesLeft })}
        </span>
      </div>
      <p className="text-[1.5rem] leading-12 text-neutral-700 [overflow-wrap:anywhere]">
        {ticket.description || t("description", { count: ticket.matchesLeft })}
      </p>
      <span className="font-primary font-bold text-[1.8rem] leading-12 text-primary-500">
        {formatMoney(
          ticket.currency === "USD" ? ticket.usdPrice : ticket.price,
          ticket.currency,
          locale,
        )}
      </span>
      {soldOut ? (
        <span className="flex items-center justify-center rounded-[10px] bg-neutral-100 py-4 text-[1.5rem] text-neutral-600">
          {tCheckout("ticket.soldout")}
        </span>
      ) : (
        <Link
          href={`/explore/season/${slugify(ticket.season.name, ticket.season.seasonId)}/checkout?pass=${ticket.seasonPassTypeId}`}
          className="group flex items-center justify-center gap-2 rounded-[10px] bg-primary-500 hover:bg-primary-600 transition-colors py-4 text-[1.5rem] font-medium text-white"
        >
          {t("buy")}
          <ArrowRight2
            size={18}
            color="#fff"
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}
