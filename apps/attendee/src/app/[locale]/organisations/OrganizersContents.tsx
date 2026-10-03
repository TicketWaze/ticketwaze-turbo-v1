"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ProfileAdd, SearchNormal1 } from "iconsax-reactjs";
import OrganizerCard from "./OrganizerCard";
import ListPageHeader from "@/components/ListPageHeader";
import { Organisation } from "@ticketwaze/typescript-config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ButtonPrimary } from "@/components/shared/buttons";

type Tab = "all" | "popular" | "following";

export default function OrganizersContents({
  organisations,
  followedOrganisations,
}: {
  organisations: Organisation[];
  followedOrganisations: Organisation[];
}) {
  const t = useTranslations("Organizers");
  const [query, setQuery] = useState("");
  // Bumped to remount the header, which clears its search field.
  const [headerKey, setHeaderKey] = useState(0);
  const [tab, setTab] = useState<Tab>("all");
  // Kept locally so following from a card shows up in "Following" at once.
  const [followed, setFollowed] = useState(followedOrganisations);
  const followedIds = new Set(followed.map((o) => o.organisationId));

  const search = query.trim().toLowerCase();
  const matches = (o: Organisation) =>
    o.organisationName.toLowerCase().includes(search);
  const popular = [...organisations].sort(
    (a, b) => (b.followers?.length ?? 0) - (a.followers?.length ?? 0),
  );
  const lists: Record<Tab, Organisation[]> = {
    all: organisations.filter(matches),
    popular: popular.filter(matches),
    following: followed.filter(matches),
  };

  function onFollowChange(organisation: Organisation, isFollowing: boolean) {
    setFollowed((current) =>
      isFollowing
        ? [...current, organisation]
        : current.filter(
            (o) => o.organisationId !== organisation.organisationId,
          ),
    );
  }

  function findOrganisations() {
    setQuery("");
    setHeaderKey((k) => k + 1);
    setTab("all");
  }

  function renderList(list: Organisation[]) {
    return (
      <ul className="list pt-4 px-4 pb-8 lg:pb-0">
        <AnimatePresence initial={true} mode="popLayout">
          {list.map((organisation, index) => (
            <motion.li
              key={organisation.organisationId}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.35,
                ease: "easeOut",
                delay: Math.min(index * 0.05, 0.3),
              }}
            >
              <OrganizerCard
                image={organisation.profileImageUrl}
                title={organisation.organisationName}
                number={organisation.events?.length ?? 0}
                id={organisation.organisationId}
                isVerified={organisation.isVerified}
                isFollowing={followedIds.has(organisation.organisationId)}
                onFollowChange={(next) => onFollowChange(organisation, next)}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    );
  }

  // Figma's empty states: an icon in two rings, the copy, "Find organisations".
  function renderEmpty(icon: React.ReactNode, text: React.ReactNode) {
    return (
      <motion.div
        className="w-132 lg:w-184 mx-auto h-full justify-center flex flex-col items-center gap-12"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-48 h-48 rounded-full flex items-center justify-center bg-neutral-100">
          <div className="w-36 h-36 rounded-full flex items-center justify-center bg-neutral-200">
            {icon}
          </div>
        </div>
        <p className="text-[1.8rem] leading-10 text-neutral-600 text-center max-w-132 lg:max-w-[42.2rem] wrap-break-word">
          {text}
        </p>
        <ButtonPrimary onClick={findOrganisations}>{t("find")}</ButtonPrimary>
      </motion.div>
    );
  }

  const noResult = search
    ? renderEmpty(
        <SearchNormal1 size="50" color="#0D0D0D" variant="Bulk" />,
        t("noResultQuery", { query: query.trim() }),
      )
    : null;

  return (
    <>
      <ListPageHeader
        key={headerKey}
        title={t("title")}
        searchPlaceholder={t("search")}
        onSearch={setQuery}
      />
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as Tab)}
        className="w-full h-full min-h-0"
      >
        <TabsList className={"w-full lg:w-fit mx-auto lg:mx-0"}>
          <TabsTrigger value="all">{t("filters.all")}</TabsTrigger>
          <TabsTrigger value="popular">{t("filters.popular")}</TabsTrigger>
          <TabsTrigger value="following">{t("filters.following")}</TabsTrigger>
        </TabsList>
        {(["all", "popular"] as const).map((value) => (
          <TabsContent
            key={value}
            value={value}
            className="min-h-0 overflow-y-scroll -mx-4"
          >
            {lists[value].length > 0 ? renderList(lists[value]) : noResult}
          </TabsContent>
        ))}
        <TabsContent
          value="following"
          className="min-h-0 overflow-y-scroll -mx-4"
        >
          {followed.length === 0
            ? renderEmpty(
                <ProfileAdd size="50" color="#0D0D0D" variant="Bulk" />,
                t("noFollowed"),
              )
            : lists.following.length > 0
              ? renderList(lists.following)
              : noResult}
        </TabsContent>
      </Tabs>
    </>
  );
}
