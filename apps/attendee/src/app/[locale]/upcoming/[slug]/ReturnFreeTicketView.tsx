"use client";
import { ButtonRed } from "@/components/shared/buttons";
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
import { useLocale, useTranslations } from "next-intl";
import { Warning2 } from "iconsax-reactjs";
import { Ticket } from "@ticketwaze/typescript-config";
import { ReturnFreeTicketAction } from "@/actions/eventActions";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { useRef, useState } from "react";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";

export default function ReturnFreeTicketView({ ticket }: { ticket: Ticket }) {
  const t = useTranslations("Event");
  const { data: session } = useSession();
  const locale = useLocale();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  async function returnTicket() {
    setIsLoading(true);
    const result = await ReturnFreeTicketAction(
      session?.user.accessToken ?? "",
      locale,
      ticket.ticketId,
    );
    if (result.status === "success") {
      router.push("/explore");
    } else {
      toast.error(result.error);
      closeRef.current?.click();
    }
    setIsLoading(false);
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <ButtonRed>{t("return")}</ButtonRed>
      </DialogTrigger>
      <DialogContent className={"w-xl lg:w-208 "}>
        <DialogHeader>
          <DialogTitle
            className={
              "font-medium border-b border-neutral-100 pb-8  text-[2.6rem] leading-12 text-black font-primary"
            }
          >
            {t("return")}
          </DialogTitle>
          <DialogDescription className={"sr-only"}>
            <span>Share event</span>
          </DialogDescription>
        </DialogHeader>
        <div className="py-8 flex flex-col gap-8 items-center">
          <div
            className={
              "w-40 h-40 rounded-full flex items-center justify-center bg-neutral-100"
            }
          >
            <div
              className={
                "w-28 h-28 rounded-full flex items-center justify-center bg-neutral-200"
              }
            >
              <Warning2 size="30" color="#0d0d0d" variant="Bulk" />
            </div>
          </div>
          <p
            className={`font-sans text-[1.4rem] leading-10 text-deep-100 text-center w-[320px] lg:w-full`}
          >
            {t("returnDescription")}
          </p>
        </div>
        <DialogFooter>
          <ButtonRed
            onClick={returnTicket}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? <LoadingCircleSmall /> : t("return")}
          </ButtonRed>
          <DialogClose ref={closeRef} className="sr-only"></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
