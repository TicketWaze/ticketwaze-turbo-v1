"use client";
import { SetStateAction, useRef, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Add } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { ButtonPrimary } from "../shared/buttons";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import LoadingCircleSmall from "../shared/LoadingCircleSmall";
import PageLoader from "../PageLoader";
import { Organisation } from "@ticketwaze/typescript-config";
import { useRouter } from "@/i18n/navigation";

export default function CreateOrganisationDialog({
  setSelectedOrganisation,
}: {
  setSelectedOrganisation: React.Dispatch<
    SetStateAction<Organisation | undefined>
  >;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const t = useTranslations("Layout.sidebar");
  const locale = useLocale();
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  async function CreateOrganisation() {
    setIsLoading(true);
    try {
      const req = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/onboarding/createOrganisation`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user.accessToken}`,
            "Accept-Language": locale,
            Origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
          },
        },
      );
      const res = await req.json();
      if (res.status === "success") {
        await update({
          activeOrganisation: res.organisation,
        });
        // router.refresh();
        window.location.href = `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/analytics`;
      } else {
        toast.error("Failed to Creare Organisation");
      }
    } catch (error) {
      toast.error("Failed to Creare Organisation : " + error);
    }
    setIsLoading(false);
  }
  return (
    <>
      <PageLoader isLoading={isLoading} />
      <Dialog>
        <DialogTrigger asChild>
          <button className={"flex gap-4 items-center lg:p-4 cursor-pointer"}>
            <div className="hidden lg:block">
              <Add size="20" color="#737c8a" variant="Bulk" />
            </div>
            <div className="lg:hidden">
              <Add
                size="25"
                className=" transition-all duration-500 stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500"
                variant="Bulk"
              />
            </div>
            <span
              className={
                "text-neutral-900 font-medium lg:font-normal lg:text-neutral-700 text-[2.2rem] lg:text-[1.5rem] leading-8"
              }
            >
              {t("new")}
            </span>
          </button>
        </DialogTrigger>
        <DialogContent className={"w-[360px] lg:w-[520px] "}>
          <DialogHeader>
            <DialogTitle
              className={
                "font-medium border-b border-neutral-100 pb-[2rem]  text-[2.6rem] leading-[30px] text-black font-primary"
              }
            >
              {t("new")}
            </DialogTitle>
            <DialogDescription className={"sr-only"}>
              <span>Add artist</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 flex flex-col gap-8 items-center">
            <div
              className={
                "w-[100px] h-[100px] rounded-full flex items-center justify-center bg-neutral-100"
              }
            >
              <div
                className={
                  "w-[70px] h-[70px] rounded-full flex items-center justify-center bg-neutral-200"
                }
              >
                <Add size="30" color="#0d0d0d" variant="Bulk" />
              </div>
            </div>
            <p
              className={`font-sans text-[1.4rem] leading-[25px] text-deep-100 text-center w-[320px] lg:w-full`}
            >
              {t("newDescription")}
            </p>
          </div>
          <DialogFooter>
            <ButtonPrimary
              onClick={CreateOrganisation}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <LoadingCircleSmall /> : t("new")}
            </ButtonPrimary>
            <DialogClose ref={closeRef} className="sr-only"></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
