"use client";
import { useRef, useState } from "react";
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
import LoadingCircleSmall from "../shared/LoadingCircleSmall";
import PageLoader from "../PageLoader";

export default function CreateOrganisationDialog({
  collapsed = false,
}: {
  /** Desktop sidebar collapsed — hide the label, keep the icon. */
  collapsed?: boolean;
} = {}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const t = useTranslations("Layout.sidebar");
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  // The organizer set-up form ("Complete Account Set-up") creates the
  // organisation with its real details; the API still refuses a second
  // owned organisation there.
  function CreateOrganisation() {
    setIsLoading(true);
    window.location.href = `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${locale}/auth/onboarding/organisation`;
  }
  return (
    <>
      <PageLoader isLoading={isLoading} />
      <Dialog>
        <DialogTrigger asChild>
          <button
            title={collapsed ? t("new") : undefined}
            className={`flex gap-4 items-center lg:p-4 cursor-pointer ${
              collapsed ? "lg:justify-center lg:w-full" : ""
            }`}
          >
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
            {/* Hidden only on desktop when collapsed — the mobile nav renders
                this same trigger and never collapses. */}
            <span
              className={`text-neutral-900 font-medium lg:font-normal lg:text-neutral-700 text-[2.2rem] lg:text-[1.5rem] leading-8 ${
                collapsed ? "lg:hidden" : ""
              }`}
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
