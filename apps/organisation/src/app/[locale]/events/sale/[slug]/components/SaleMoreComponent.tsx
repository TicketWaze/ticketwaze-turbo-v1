"use client";
import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Edit2, HamburgerMenu, MoreCircle, Trash } from "iconsax-reactjs";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import SaleDrawerContent from "./SaleDrawerContent";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Sale } from "@ticketwaze/typescript-config";
import { DeleteSale } from "@/actions/SaleActions";
import { ButtonRed } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Link, useRouter } from "@/i18n/navigation";
import { slugify } from "@/lib/Slugify";

export default function SaleMoreComponent({ sale }: { sale: Sale }) {
  const t = useTranslations("Sales.single_sale");
  const locale = useLocale();
  const router = useRouter();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function remove() {
    setIsLoading(true);
    const result = await DeleteSale(
      sale.organisationId,
      sale.saleId,
      locale,
    );
    setIsLoading(false);
    if (result.status !== "success") {
      toast.error(result.error);
      return;
    }
    closeRef.current?.click();
    // Deleted or unlisted — the API decides which, and says so in the message.
    toast.success(result.message || t("delete_dialog.done"));
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
            {/*
              Details first, exactly as on the event page. The description and
              the cover moved off the page and in here: the page itself is now
              the numbers and the list of buyers, and the product's own blurb is
              one click away rather than occupying the middle of it.
            */}
            <li>
              <Drawer direction={"right"}>
                <DrawerTrigger className={"w-full"}>
                  <div
                    className={
                      "font-normal cursor-pointer group text-[1.5rem] border-b border-neutral-200 py-4 leading-8 text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full"
                    }
                  >
                    <span>{t("details")}</span>
                    <HamburgerMenu size="20" variant="Bulk" color={"#2E3237"} />
                  </div>
                </DrawerTrigger>
                <SaleDrawerContent sale={sale} />
              </Drawer>
            </li>
            <li>
              <Link
                href={`/events/sale/${slugify(sale.title, sale.saleId)}/edit`}
                className={
                  "font-normal cursor-pointer group text-[1.5rem] border-b border-neutral-200 py-4 leading-8 text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full"
                }
              >
                <span>{t("edit")}</span>
                <Edit2 size="20" variant="Bulk" color={"#2E3237"} />
              </Link>
            </li>
            <li>
              <Dialog>
                <DialogTrigger className="w-full">
                  <div
                    className={
                      "font-normal cursor-pointer group text-[1.5rem] border-b border-neutral-200 py-4 leading-8 text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full"
                    }
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
                      {t("delete_dialog.title")}
                    </DialogTitle>
                    <DialogDescription className={"sr-only"}>
                      Delete product
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-8">
                    <p className="text-[1.5rem] leading-8 text-neutral-600">
                      {t("delete_dialog.warning")}
                    </p>
                    {/* Buyers keep what they paid for: a product that has sold
                        is unlisted instead of removed, and the seller should
                        know that before confirming rather than after. */}
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                      <span className="text-[1.4rem] leading-7 text-amber-700">
                        {t("delete_dialog.buyers_note")}
                      </span>
                    </div>
                  </div>
                  <DialogFooter>
                    <ButtonRed
                      onClick={remove}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <LoadingCircleSmall />
                      ) : (
                        t("delete_dialog.cta")
                      )}
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
