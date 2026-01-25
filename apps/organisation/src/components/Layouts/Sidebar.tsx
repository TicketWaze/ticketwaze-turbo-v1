"use client";
import { useEffect, useRef, useState } from "react";
import Logo from "@/assets/images/logo-horizontal-orange-org.svg";
import Image from "next/image";
import {
  Add,
  ArrowSwapHorizontal,
  Chart1,
  I24Support,
  Logout,
  Moneys,
  Setting2,
  Ticket,
} from "iconsax-reactjs";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import VerifierOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";
import { signOut, useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DialogClose } from "@radix-ui/react-dialog";
import { useAuthInterceptor } from "@/hooks/useAuthInterceptor";
import { cn } from "@/lib/utils";
import { Organisation } from "@ticketwaze/typescript-config";
import { ButtonPrimary } from "../shared/buttons";
import LoadingCircleSmall from "../shared/LoadingCircleSmall";

function Sidebar({ className }: { className: string }) {
  const t = useTranslations("Layout.sidebar");
  const pathname = usePathname();
  useAuthInterceptor();

  const { data: session, update } = useSession();

  const organisation = session?.activeOrganisation;
  const [allOrganisations, setAllOrganisations] = useState<Organisation[]>([]);
  const [selectedOrganisation, setSelectedOrganisation] =
    useState<Organisation>();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!session?.user?.accessToken) return;
    setIsLoading(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/me/${organisation?.organisationId}`,
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
  }, [session?.user?.accessToken, session?.activeOrganisation]);

  const links = [
    {
      label: t("analytics"),
      path: "/analytics",
      Icon: Chart1,
    },
    {
      label: t("events"),
      path: "/events",
      Icon: Ticket,
    },
    {
      label: t("finance"),
      path: "/finance",
      Icon: Moneys,
    },
    {
      label: t("settings"),
      path: "/settings",
      Icon: Setting2,
    },
  ];

  function isActive(path: string) {
    return pathname.startsWith(path);
  }

  const router = useRouter();
  const CloseRef = useRef<HTMLButtonElement>(null);

  async function switchOrganisation(organisation: Organisation) {
    setLoading(true);
    await update({ activeOrganisation: organisation });
    setLoading(false);
    CloseRef.current?.click();
    router.refresh();
  }

  return (
    <aside className={cn("flex-col hidden lg:flex", className)}>
      <div className={"flex-1 pt-12 flex flex-col gap-16"}>
        <Image src={Logo} alt={"Ticket Waze Logo"} width={250} height={40} />
        <nav>
          <ul className="flex flex-col gap-4">
            {links.map(({ path, Icon, label }) => {
              return (
                <li key={label}>
                  <Link
                    href={path}
                    className={`group flex items-center gap-4 py-4 relative text-[1.5rem] leading-8 ${isActive(path) ? "font-semibold text-primary-500 is-active" : "text-neutral-700 hover:text-primary-500"}`}
                  >
                    <Icon
                      size="20"
                      className={`transition-all duration-500 ${isActive(path) ? "stroke-primary-500 fill-primary-500" : "stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500"}  `}
                      // className={`${isActive(path) ? "fill-icon-active" : "fill-icon"} group-hover:fill-icon-active`}
                      variant="Bulk"
                    />
                    <span>{label}</span>
                    <div
                      className={
                        "absolute right-0  opacity-0 group-[.is-active]:translate-x-0 group-[.is-active]:opacity-100 transition-all duration-500 bg-primary-500 w-[.2rem] h-full"
                      }
                    ></div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      <div className="bg-neutral-300 rounded-[12.5px] p-[2.5px]">
        <ul>
          {/* help */}
          <li>
            <Link
              href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/${locale}/contact`}
              target={"_blank"}
              rel={"noreferrer"}
              className={"flex gap-4 items-center p-4"}
            >
              <I24Support size="20" color="#737c8a" variant="Bulk" />
              <span className={"text-neutral-700 text-[1.5rem] leading-8"}>
                {t("help")}
              </span>
            </Link>
          </li>
          {/* switch organisation */}
          {isLoading ? null : allOrganisations &&
            allOrganisations?.length > 1 ? (
            <li className="">
              <Dialog>
                <DialogTrigger>
                  <div className={"flex gap-4 items-center p-4 cursor-pointer"}>
                    <ArrowSwapHorizontal
                      size="20"
                      color="#737c8a"
                      variant="Bulk"
                    />
                    <span
                      className={"text-neutral-700 text-[1.5rem] leading-8"}
                    >
                      {t("switching")}
                    </span>
                  </div>
                </DialogTrigger>
                <DialogContent
                  className={"w-xl lg:w-208 flex flex-col gap-16 "}
                >
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
                              <span className="w-14 h-14 flex items-center justify-center bg-black rounded-full text-white uppercase font-medium text-[2.2rem] leading-120 font-primary">
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
                            onClick={() =>
                              setSelectedOrganisation(organisation)
                            }
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
          ) : (
            <li>
              {/* <Link
                href={"/auth/create-organisation"}
                className={"flex gap-4 items-center p-4 cursor-pointer"}
              >
                <Add size="20" color="#737c8a" variant="Bulk" />
                <span className={"text-neutral-700 text-[1.5rem] leading-8"}>
                  {t("new")}
                </span>
              </Link> */}
            </li>
          )}

          {/* logout */}
          <li className={"flex gap-4 items-center"}>
            <button
              onClick={() =>
                signOut({
                  redirect: true,
                  redirectTo: `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${session?.user.userPreference.appLanguage}/auth/login`,
                })
              }
              className={"flex gap-4 items-center cursor-pointer p-4"}
            >
              <Logout size="20" color="#737c8a" variant="Bulk" />
              <span className={"text-neutral-700 text-[1.5rem] leading-8"}>
                {t("logout")}
              </span>
            </button>
          </li>
          {/* Premium + Organisation */}
          <li>
            <div className="mx-2 mb-2 rounded-[1.2rem] p-[.2rem] bg-linear-to-r from-primary-500 via-[#E752AE] to-[#DD068B]">
              <Link
                href="/settings/profile"
                className="flex items-center gap-4 bg-neutral-100 p-4 rounded-[10px]"
              >
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
                    {organisation?.organisationName.slice()[0]?.toUpperCase()}
                  </span>
                )}

                <div
                  className={"text-neutral-700 text-[1.5rem] flex-1 leading-8"}
                >
                  <span>
                    {organisation?.organisationName}{" "}
                    {organisation?.isVerified ? (
                      <VerifierOrganisationCheckMark />
                    ) : null}
                  </span>
                </div>
              </Link>
            </div>
          </li>
          {/* Non Premium Organisation */}
          <li className="hidden">
            <Link
              href={"/settings/profile"}
              className={
                "flex items-center gap-4 bg-neutral-100 p-4 mx-2 mb-2 rounded-[10px]"
              }
            >
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
                  {organisation?.organisationName.slice()[0]?.toUpperCase()}
                </span>
              )}

              <div
                className={"text-neutral-700 text-[1.5rem] flex-1 leading-8"}
              >
                <span>
                  {organisation?.organisationName}{" "}
                  {organisation?.isVerified ? (
                    <VerifierOrganisationCheckMark />
                  ) : null}
                </span>
              </div>
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
}

export default Sidebar;
