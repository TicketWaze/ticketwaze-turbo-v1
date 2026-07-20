"use client";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Edit2, HamburgerMenu, MoreCircle, Trash } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import RestaurantDrawerContent from "./RestaurantDrawerContent";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Restaurant } from "@ticketwaze/typescript-config";
import { DeleteRestaurant } from "@/actions/EventActions";
import { toast } from "sonner";
import { ButtonRed } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { useSession } from "next-auth/react";
import { Link, useRouter } from "@/i18n/navigation";
import { slugify } from "@/lib/Slugify";

export default function RestaurantMoreComponent({
  restaurant,
  hasSales,
}: {
  restaurant: Restaurant;
  hasSales: boolean;
}) {
  const t = useTranslations("Events.restaurantDetail");
  const closeRef = useRef<HTMLButtonElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();

  const slug = slugify(restaurant.name, restaurant.restaurantId);

  /**
   * Deletion is blocked once money has moved. The rows are referenced by orders,
   * order items and ledger entries, so removing the venue would take financial
   * history with it — those venues close via isPermanentlyClosed instead. The
   * API enforces this too (409); this just avoids offering an action that
   * cannot succeed.
   */
  async function handleDelete() {
    setIsLoading(true);
    const result = await DeleteRestaurant(
      restaurant.organisationId,
      restaurant.restaurantId,
      session?.user.accessToken ?? "",
      locale,
    );
    setIsLoading(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    closeRef.current?.click();
    toast.success(t("deleted"));
    router.push("/events");
  }

  return (
    <Popover>
      <PopoverTrigger>
        <div
          className={
            "w-14 h-14 cursor-pointer rounded-full bg-neutral-100 flex items-center justify-center"
          }
        >
          <MoreCircle variant={"Bulk"} size={20} color={"#737C8A"} />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className={"w-100 p-0 m-0 bg-none shadow-none border-none mx-4"}
      >
        <ul
          className={
            "bg-neutral-100 border border-neutral-200 right-8 p-4 mb-8 rounded-2xl shadow-xl bottom-full flex flex-col gap-4"
          }
        >
          <span
            className={
              "font-medium py-2 border-b border-neutral-200 text-[1.4rem] text-deep-100 leading-8"
            }
          >
            {t("more")}
          </span>
          <div className={"flex flex-col gap-4"}>
            <li>
              <Drawer direction={"right"}>
                <DrawerTrigger className={"w-full"}>
                  <div
                    className={`font-normal cursor-pointer group text-[1.5rem] border-b border-neutral-200 py-4 leading-8 text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
                  >
                    <span>{t("details")}</span>
                    <HamburgerMenu size="20" variant="Bulk" color={"#2E3237"} />
                  </div>
                </DrawerTrigger>
                <RestaurantDrawerContent restaurant={restaurant} />
              </Drawer>
            </li>
            <li>
              <Link
                href={`/events/restaurant/${slug}/edit`}
                className={`font-normal cursor-pointer group text-[1.5rem] border-b border-neutral-200 py-4 leading-8 text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
              >
                <span>{t("edit")}</span>
                <Edit2 size="20" variant="Bulk" color={"#2E3237"} />
              </Link>
            </li>
            <li>
              <Dialog>
                <DialogTrigger className="w-full">
                  <div
                    className={`font-normal cursor-pointer group text-[1.5rem] py-4 leading-8 text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
                  >
                    <span className={"text-failure"}>{t("delete")}</span>
                    <Trash size="20" variant="Bulk" color={"#DE0028"} />
                  </div>
                </DialogTrigger>
                <DialogContent className={"w-xl lg:w-208"}>
                  <DialogHeader>
                    <DialogTitle
                      className={
                        "font-medium border-b border-neutral-100 pb-8 text-[2.6rem] leading-12 text-black font-primary"
                      }
                    >
                      {t("delete")}
                    </DialogTitle>
                    <DialogDescription className={"sr-only"}>
                      Delete restaurant
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-8 py-4">
                    <p className="text-[1.5rem] leading-8 text-neutral-600">
                      {hasSales ? t("delete_blocked") : t("delete_warning")}
                    </p>
                  </div>
                  <DialogFooter>
                    <ButtonRed
                      onClick={handleDelete}
                      disabled={isLoading || hasSales}
                      className="w-full"
                    >
                      {isLoading ? <LoadingCircleSmall /> : t("delete_cta")}
                    </ButtonRed>
                    <DialogClose ref={closeRef} className="sr-only" />
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </li>
          </div>
        </ul>
      </PopoverContent>
    </Popover>
  );
}
