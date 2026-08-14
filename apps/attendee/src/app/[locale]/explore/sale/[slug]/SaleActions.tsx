"use client";
import {
  AddEventToFavorite,
  RemoveEventToFavorite,
} from "@/actions/eventActions";
import NoAuthDialog from "@/components/Layouts/NoAuthDialog";
import ReportEventComponent from "../../[slug]/ReportEventComponent";
import ReportOrganisationComponent from "../../[slug]/ReportOrganisationComponent";
import ShareEvent from "@/components/shared/ShareEvent";
import { usePathname } from "@/i18n/navigation";
import { slugify } from "@/lib/Slugify";
import { Heart, MoreCircle } from "iconsax-reactjs";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { PublicSale } from "@ticketwaze/typescript-config";
import PageLoader from "@/components/PageLoader";
import { LinkPrimary } from "@/components/shared/Links";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * The action row on a product page.
 *
 * Same shape as `RaffleActions` — favourite, share, report, then the primary
 * action — so a product page reads as another Ticketwaze activity rather than
 * a different product.
 *
 * Signed-out buyers are routed to sign in rather than offered a guest
 * checkout: digital products have no guest purchase, and the API refuses one.
 */
export default function SaleActions({
  sale,
  isFavorite,
}: {
  sale: PublicSale;
  isFavorite: boolean;
}) {
  const t = useTranslations("Event");
  const st = useTranslations("Sale");
  const locale = useLocale();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [fav, setFav] = useState(isFavorite);

  // Shared and linked by the id-suffixed slug, so a later rename never breaks
  // a link somebody already sent.
  const saleSlug = slugify(sale.title, sale.saleId);
  const saleUrl = `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/explore/sale/${saleSlug}`;

  // Favourites are keyed on activityId, which a sale shares with its activities
  // row — so the existing endpoint works unchanged.
  async function addFavorite() {
    setIsLoading(true);
    const result = await AddEventToFavorite(
      session?.user?.accessToken as string,
      sale.saleId,
      sale.organisationId,
      pathname,
      locale,
    );
    if (result.error) toast.error(result.message);
    else setFav(true);
    setIsLoading(false);
  }

  async function removeFavorite() {
    setIsLoading(true);
    const result = await RemoveEventToFavorite(
      session?.user?.accessToken as string,
      sale.saleId,
      pathname,
      locale,
    );
    if (result.error) toast.error(result.message);
    else setFav(false);
    setIsLoading(false);
  }

  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
      <PageLoader isLoading={isLoading} />
      <div className="flex items-center gap-4">
        <ShareEvent url={saleUrl} />
        {session?.user && fav && (
          <button
            disabled={isLoading}
            onClick={removeFavorite}
            className="p-[7.5px] group flex items-center justify-center rounded-[30px] cursor-pointer bg-primary-100"
          >
            <Heart width={20} height={20} color="#E45B00" variant="Bulk" />
          </button>
        )}
        {session?.user && !fav && (
          <button
            disabled={isLoading}
            onClick={addFavorite}
            className="w-fit h-fit p-[7.5px] group flex items-center justify-center bg-neutral-100 rounded-full cursor-pointer hover:bg-primary-100 transition-all ease-in-out duration-500"
          >
            <Heart
              width={20}
              height={20}
              className="stroke-neutral-700 fill-neutral-700 group-hover:stroke-primary-500 group-hover:fill-primary-500 transition-all ease-in-out duration-500"
              variant="Bulk"
            />
          </button>
        )}
        {!session?.user && (
          <Dialog>
            <DialogTrigger>
              <span className="w-fit h-fit p-[7.5px] group flex items-center justify-center bg-neutral-100 rounded-[30px] cursor-pointer hover:bg-primary-100 transition-all ease-in-out duration-500">
                <Heart
                  width={20}
                  height={20}
                  className="stroke-neutral-700 fill-neutral-700 group-hover:stroke-primary-500 group-hover:fill-primary-500 transition-all ease-in-out duration-500"
                  variant="Bulk"
                />
              </span>
            </DialogTrigger>
            <NoAuthDialog callbackUrl={pathname} />
          </Dialog>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <span className="w-fit h-fit p-[7.5px] group flex items-center justify-center bg-neutral-100 rounded-[30px] cursor-pointer hover:bg-primary-100 transition-all ease-in-out duration-500">
              <MoreCircle
                variant={"Bulk"}
                color={"#737C8A"}
                width={20}
                height={20}
              />
            </span>
          </PopoverTrigger>
          <PopoverContent
            className={
              "bg-neutral-100 border border-neutral-200 right-8 p-4 pb-8 w-92  mb-8 rounded-2xl shadow-xl bottom-full flex flex-col gap-4"
            }
          >
            <span
              className={
                "font-medium py-2 border-b border-neutral-200 text-[1.4rem] text-deep-100 leading-8"
              }
            >
              {t("more")}
            </span>
            <ReportEventComponent
              activityId={sale.saleId}
              organisationId={sale.organisationId}
            />
            <div className="h-px bg-neutral-200 w-full"></div>
            <ReportOrganisationComponent organisationId={sale.organisationId} />
          </PopoverContent>
        </Popover>
      </div>

      {/* Signed-out buyers are sent to sign in first: guest purchase of a
          digital product is not built, and the API would refuse it. */}
      {session?.user ? (
        <LinkPrimary
          href={`/explore/sale/${saleSlug}/checkout`}
          className="py-[7.5px] px-12 text-[1.5rem] font-semibold tracking-[-0.50px] normal font-sans"
        >
          {st("buyNow")}
        </LinkPrimary>
      ) : (
        <Dialog>
          <DialogTrigger>
            <span className="px-12 py-6 border-2 border-transparent rounded-[100px] text-center text-white font-medium text-[1.5rem] h-auto leading-8 cursor-pointer transition-all duration-400 flex items-center justify-center bg-primary-500 hover:bg-primary-500/80 hover:border-primary-600">
              {st("buyNow")}
            </span>
          </DialogTrigger>
          <NoAuthDialog callbackUrl={`/explore/sale/${saleSlug}/checkout`} />
        </Dialog>
      )}
    </div>
  );
}
