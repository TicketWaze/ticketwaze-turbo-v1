"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import OrganizerCard from "./OrganizerCard";
import { Add, Building, CloseCircle, SearchNormal } from "iconsax-reactjs";
import { useSession } from "next-auth/react";
import { Organisation } from "@ticketwaze/typescript-config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ButtonPrimary } from "@/components/shared/buttons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LinkPrimary } from "@/components/shared/Links";
import { Link } from "@/i18n/navigation";

export default function OrganizersContents({
  organisations,
  followedOrganisations,
}: {
  organisations: Organisation[];
  followedOrganisations: Organisation[];
}) {
  const t = useTranslations("Organizers");
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const filteredOrganisations = organisations.filter((organisation) => {
    const search = query.toLowerCase();
    return organisation.organisationName.toLowerCase().includes(search);
  });
  const filteredFollowedOrganisations = session?.user
    ? followedOrganisations.filter((organisation) => {
        const search = query.toLowerCase();
        return organisation.organisationName.toLowerCase().includes(search);
      })
    : [];
  const [mobileSearch, setMobileSearch] = useState(false);
  return (
    <>
      <header className="w-full flex items-center justify-between">
        {!mobileSearch && (
          <div className="flex flex-col gap-[5px]">
            {session?.user && (
              <span className="text-[1.6rem] leading-8 text-neutral-600">
                {t("subtitle")}{" "}
                <span className="text-deep-100">{session?.user.firstName}</span>
              </span>
            )}
            <span className="font-primary font-medium text-[1.8rem] lg:text-[2.6rem] leading-[2.5rem] lg:leading-12 text-black">
              {t("title")}
            </span>
          </div>
        )}
        <div className={`flex items-center gap-4 ${mobileSearch && "w-full"}`}>
          {mobileSearch && (
            <div
              className={
                "bg-neutral-100 w-full rounded-[30px] flex items-center justify-between lg:hidden px-[1.5rem] py-4"
              }
            >
              <input
                placeholder={t("search")}
                className={
                  "text-black font-normal text-[1.4rem] leading-8 w-full outline-none"
                }
                autoFocus
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                onClick={() => {
                  setMobileSearch(!mobileSearch);
                  setQuery("");
                }}
              >
                <CloseCircle size="20" color="#737c8a" variant="Bulk" />
              </button>
            </div>
          )}
          <div
            className={
              "hidden bg-neutral-100 rounded-[30px] lg:flex items-center justify-between w-[243px] px-[1.5rem] py-4"
            }
          >
            <input
              placeholder={t("search")}
              className={
                "text-black font-normal text-[1.4rem] leading-8 w-full outline-none"
              }
              onChange={(e) => setQuery(e.target.value)}
            />
            <SearchNormal size="20" color="#737c8a" variant="Bulk" />
          </div>
          {!mobileSearch && (
            <button
              onClick={() => setMobileSearch(!mobileSearch)}
              className={
                "w-[35px] h-[35px] bg-neutral-100 rounded-full flex lg:hidden items-center justify-center"
              }
            >
              <SearchNormal size="20" color="#737c8a" variant="Bulk" />
            </button>
          )}
          {session?.user.organisations &&
          session?.user.organisations?.length > 0 ? (
            <Link
              className="lg:hidden absolute bottom-43 right-10 w-[60px] h-[60px] bg-primary-500 rounded-full flex items-center justify-center"
              href="/events/create"
            >
              {/* {t("create")} */}
              <Building size="32" variant="Bulk" color="#ffffff" />
            </Link>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <button className="lg:hidden absolute bottom-43 right-10 w-[60px] h-[60px] bg-primary-500 rounded-full flex items-center justify-center">
                  <Add size="32" color="#ffffff" />
                </button>
              </DialogTrigger>
              <DialogContent className={"w-[360px] lg:w-[520px] "}>
                <DialogHeader>
                  <DialogTitle
                    className={
                      "font-medium border-b border-neutral-100 pb-[2rem]  text-[2.6rem] leading-[30px] text-black font-primary"
                    }
                  >
                    {t("create")}
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
                      <Building size="30" color="#0d0d0d" variant="Bulk" />
                    </div>
                  </div>
                  <p
                    className={`font-sans text-[1.6rem] leading-10 text-deep-100 text-center w-[320px] lg:w-full`}
                  >
                    {t("createDescription")}
                  </p>
                </div>
                <DialogFooter>
                  <LinkPrimary
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`${process.env.NEXT_PUBLIC_ORGANISATION_URL}/auth/login`}
                    className="w-full"
                  >
                    {t("proceed")}
                  </LinkPrimary>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {session?.user.organisations &&
          session?.user.organisations?.length > 0 ? (
            <LinkPrimary
              href={`${process.env.NEXT_PUBLIC_ORGANISATION_URL}/auth/login`}
              className="hidden lg:flex"
            >
              {t("dashboard")}
            </LinkPrimary>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <ButtonPrimary className="hidden lg:flex">
                  {t("create")}
                </ButtonPrimary>
              </DialogTrigger>
              <DialogContent className={"w-[360px] lg:w-[520px] "}>
                <DialogHeader>
                  <DialogTitle
                    className={
                      "font-medium border-b border-neutral-100 pb-[2rem]  text-[2.6rem] leading-[30px] text-black font-primary"
                    }
                  >
                    {t("create")}
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
                      <Building size="30" color="#0d0d0d" variant="Bulk" />
                    </div>
                  </div>
                  <p
                    className={`font-sans text-[1.6rem] leading-10 text-deep-100 text-center w-[320px] lg:w-full`}
                  >
                    {t("createDescription")}
                  </p>
                </div>
                <DialogFooter>
                  <LinkPrimary
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`${process.env.NEXT_PUBLIC_ORGANISATION_URL}/auth/login`}
                    className="w-full"
                  >
                    {t("proceed")}
                  </LinkPrimary>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>
      <Tabs defaultValue="all" className="w-full h-full min-h-0">
        <TabsList className={"w-full lg:w-fit mx-auto lg:mx-0"}>
          <TabsTrigger value="all">{t("filters.all")}</TabsTrigger>
          {session?.user && (
            <TabsTrigger value="following">
              {t("filters.following")}
            </TabsTrigger>
          )}
          {/* <TabsTrigger value="popular">{t('filters.popular')}</TabsTrigger> */}
        </TabsList>
        <TabsContent value="all" className="min-h-0 overflow-y-scroll">
          <ul className="list pt-4">
            {filteredOrganisations.map((organisation) => {
              const events = organisation.events.length;
              return (
                <li key={organisation.organisationId}>
                  <OrganizerCard
                    image={organisation.profileImageUrl}
                    title={organisation.organisationName}
                    number={events}
                    id={organisation.organisationId}
                    city={organisation.city}
                    country={organisation.country}
                    isVerified={organisation.isVerified}
                  />
                </li>
              );
            })}
          </ul>
          {filteredOrganisations.length === 0 && (
            <div className="flex flex-col items-center gap-[30px]">
              <div className="h-[120px] w-[120px] bg-neutral-100 rounded-full flex items-center justify-center">
                <div className="w-[90px] h-[90px] bg-neutral-200 flex items-center justify-center rounded-full">
                  <Building size="50" color="#0D0D0D" variant="Bulk" />
                </div>
              </div>
              <p className="font-primary text-[1.8rem] leading-8 text-neutral-600 text-center max-w-70 wrap-break-word">
                {t("profile.noResult")}{" "}
                <span className="text-deep-100">{query}</span>
              </p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="following">
          {followedOrganisations.length > 0 ? (
            <>
              <ul className="list pt-4">
                {filteredFollowedOrganisations.map((organisation) => {
                  const events = organisation.events.length;
                  return (
                    <li key={organisation.organisationId}>
                      <OrganizerCard
                        image={organisation.profileImageUrl}
                        title={organisation.organisationName}
                        number={events}
                        id={organisation.organisationId}
                        city={organisation.city}
                        country={organisation.country}
                        isVerified={organisation.isVerified}
                      />
                    </li>
                  );
                })}
              </ul>
              {filteredFollowedOrganisations.length === 0 && (
                <div className="flex flex-col items-center gap-[30px]">
                  <div className="h-[120px] w-[120px] bg-neutral-100 rounded-full flex items-center justify-center">
                    <div className="w-[90px] h-[90px] bg-neutral-200 flex items-center justify-center rounded-full">
                      <Building size="50" color="#0D0D0D" variant="Bulk" />
                    </div>
                  </div>
                  <p className="font-primary text-[1.8rem] leading-8 text-neutral-600 text-center max-w-70 wrap-break-word">
                    {t("profile.noResult")}{" "}
                    <span className="text-deep-100">{query}</span>
                  </p>
                </div>
              )}
            </>
          ) : (
            <div
              className={
                "w-[330px] lg:w-[460px] mx-auto h-full justify-center flex flex-col items-center gap-[5rem]"
              }
            >
              <div
                className={
                  "w-[120px] h-[120px] rounded-full flex items-center justify-center bg-neutral-100"
                }
              >
                <div
                  className={
                    "w-[90px] h-[90px] rounded-full flex items-center justify-center bg-neutral-200"
                  }
                >
                  <Building size="50" color="#0d0d0d" variant="Bulk" />
                </div>
              </div>
              <div className={"flex flex-col gap-12 items-center text-center"}>
                <p
                  className={
                    "text-[1.8rem] leading-[25px] text-neutral-600 max-w-[330px] lg:max-w-[422px]"
                  }
                >
                  {t("noFollowed")}
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
