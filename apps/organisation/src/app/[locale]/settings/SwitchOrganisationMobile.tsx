"use client";
import { useRouter } from "@/i18n/navigation";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowRight2, ArrowSwapHorizontal } from "iconsax-reactjs";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Organisation } from "@ticketwaze/typescript-config";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import CreateOrganisationDialog from "@/components/Layouts/CreateOrganisationDialog";

export default function SwitchOrganisationMobile() {
  const t = useTranslations("Settings");
  const locale = useLocale();
  const { data: session, update } = useSession();
  const [allOrganisations, setAllOrganisations] = useState<Organisation[]>([]);
  const [selectedOrganisation, setSelectedOrganisation] =
    useState<Organisation>();

  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!session?.user?.accessToken) return;
    setIsLoading(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/me/${session.activeOrganisation.organisationId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user.accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
      },
    )
      .then((res) => res.json())
      .then((res) => setAllOrganisations(res.organisations))
      .finally(() => setIsLoading(false));
  }, [session?.user?.accessToken]);

  const router = useRouter();
  const CloseRef = useRef<HTMLButtonElement>(null);

  async function switchOrganisation(organisation: Organisation) {
    setLoading(true);
    await update({ activeOrganisation: organisation });
    setLoading(false);
    CloseRef.current?.click();
    router.refresh();
  }

  const hasOrganisation = allOrganisations.filter(
    (organisation) => organisation.userId === session?.user.userId,
  );
  return (
    <>
      {allOrganisations.length > 1 && (
        <li className="lg:hidden">
          <Dialog>
            <DialogTrigger className="w-full">
              <div
                className={
                  "py-14 px-6 rounded-[10px] w-full bg-neutral-100 hover:bg-primary-50 flex justify-between transition-all duration-500 cursor-pointer group"
                }
              >
                <div className={"flex items-center gap-6"}>
                  <ArrowSwapHorizontal
                    size="25"
                    className=" transition-all duration-500 stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500"
                    variant="Bulk"
                  />
                  <span
                    className={
                      "font-primary font-medium text-[2.2rem] transition-all duration-500 leading-12 text-neutral-900 group-hover:text-primary-500"
                    }
                  >
                    {t("switch")}
                  </span>
                </div>
                <div
                  className={
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 bg-neutral-200 group-hover:bg-primary-100"
                  }
                >
                  <ArrowRight2
                    size="20"
                    className=" transition-all duration-500 stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500"
                    variant="Bulk"
                  />
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className={"w-xl lg:w-208 flex flex-col gap-16 "}>
              <DialogHeader>
                <DialogTitle
                  className={
                    "font-medium border-b border-neutral-100 pb-8  text-[2.6rem] leading-12 text-black font-primary"
                  }
                >
                  {t("switch")}
                </DialogTitle>
                <DialogDescription className={"sr-only"}>
                  <span>Share event</span>
                </DialogDescription>
              </DialogHeader>
              <RadioGroup
                className="flex flex-col gap-8"
                defaultValue={session?.activeOrganisation.organisationId}
              >
                {allOrganisations.map((organisation) => {
                  return (
                    <div
                      key={organisation.organisationId}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-4">
                        {organisation?.profileImageUrl ? (
                          <Image
                            src={organisation.profileImageUrl}
                            width={35}
                            height={35}
                            alt={organisation.organisationName}
                            className="rounded-full"
                          />
                        ) : (
                          <span className="w-14 h-14 flex items-center justify-center bg-black rounded-full text-white uppercase font-medium text-[2.2rem] leading-12 font-primary">
                            {organisation?.organisationName
                              .slice()[0]
                              ?.toUpperCase()}
                          </span>
                        )}
                        <span className="text-[1.6rem]">
                          {organisation.organisationName}
                        </span>
                      </div>
                      <RadioGroupItem
                        onClick={() => setSelectedOrganisation(organisation)}
                        value={organisation.organisationId}
                      />
                    </div>
                  );
                })}
              </RadioGroup>
              <DialogFooter>
                <DialogClose ref={CloseRef}></DialogClose>
                <ButtonPrimary
                  onClick={() =>
                    switchOrganisation(selectedOrganisation as Organisation)
                  }
                  disabled={isLoading}
                  className="w-full"
                >
                  {loading ? <LoadingCircleSmall /> : t("switching")}
                </ButtonPrimary>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </li>
      )}
      {hasOrganisation.length === 0 && (
        <div
          className={
            "py-14 px-6 rounded-[10px] w-full bg-neutral-100 hover:bg-primary-50 flex justify-between transition-all duration-500 cursor-pointer group"
          }
        >
          <CreateOrganisationDialog
            setSelectedOrganisation={setSelectedOrganisation}
          />
          <div
            className={
              "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 bg-neutral-200 group-hover:bg-primary-100"
            }
          >
            <ArrowRight2
              size="20"
              className=" transition-all duration-500 stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500"
              variant="Bulk"
            />
          </div>
        </div>
      )}
    </>
  );
}
