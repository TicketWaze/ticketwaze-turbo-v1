"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import OrganizerCard from "./OrganizerCard";
import { CloseCircle, SearchNormal, Ticket } from "iconsax-reactjs";
import { useSession } from "next-auth/react";
import { Organisation } from "@ticketwaze/typescript-config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
                  "text-black font-normal text-[1.4rem] leading-[20px] w-full outline-none"
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
                "text-black font-normal text-[1.4rem] leading-[20px] w-full outline-none"
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
                  <Ticket size="50" color="#0D0D0D" variant="Bulk" />
                </div>
              </div>
              <span className="font-primary text-[1.8rem] leading-8 text-neutral-600">
                {t("profile.noResult")}{" "}
                <span className="text-deep-100">{query}</span>
              </span>
            </div>
          )}
        </TabsContent>
        {session?.user && (
          <TabsContent value="following">
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
                    <Ticket size="50" color="#0D0D0D" variant="Bulk" />
                  </div>
                </div>
                <span className="font-primary text-[1.8rem] leading-8 text-neutral-600">
                  {t("profile.noResult")}{" "}
                  <span className="text-deep-100">{query}</span>
                </span>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}
