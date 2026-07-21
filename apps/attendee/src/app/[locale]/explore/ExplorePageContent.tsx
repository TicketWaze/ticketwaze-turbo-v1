"use client";
import NoAuthDialog from "@/components/Layouts/NoAuthDialog";
import EventCard from "@/components/shared/EventCard";
import RaffleCard from "@/components/shared/RaffleCard";
import RestaurantCard from "@/components/shared/RestaurantCard";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "@/i18n/navigation";
import { Event, Raffle, Restaurant } from "@ticketwaze/typescript-config";
import {
  CloseCircle,
  Heart,
  Money3,
  SearchNormal,
  Ticket,
} from "iconsax-reactjs";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ExplorePageContent({
  events,
  pastEvents = [],
  raffles = [],
  restaurants = [],
  htgExchangeRate,
}: {
  events: Event[];
  pastEvents?: Event[];
  raffles?: Raffle[];
  restaurants?: Restaurant[];
  wallet: null;
  // The rate the cards price HTG activities with. Fetched once on the server
  // rather than per card.
  htgExchangeRate?: number;
}) {
  const t = useTranslations("Explore");
  const [query, setQuery] = useState("");
  const matchesQuery = (event: Event) =>
    event.eventName.toLowerCase().includes(query.toLowerCase());
  const filteredEvents = events.filter(matchesQuery);
  const filteredPastEvents = pastEvents.filter(matchesQuery);
  const filteredRaffles = raffles.filter((raffle) =>
    raffle.title.toLowerCase().includes(query.toLowerCase()),
  );
  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.name.toLowerCase().includes(query.toLowerCase()),
  );
  const hasAnyEvents =
    events.length > 0 ||
    pastEvents.length > 0 ||
    raffles.length > 0 ||
    restaurants.length > 0;
  const noSearchResults =
    filteredEvents.length === 0 &&
    filteredPastEvents.length === 0 &&
    filteredRaffles.length === 0 &&
    filteredRestaurants.length === 0;
  const { data: session } = useSession();

  const [mobileSearch, setMobileSearch] = useState(false);
  return (
    <>
      <motion.header
        className="w-full flex items-center justify-between"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {!mobileSearch && (
          <div className="flex flex-col gap-2">
            {session?.user && (
              <span className="text-[1.6rem] leading-8 text-neutral-600">
                {t("subtitle")}{" "}
                <span className="text-deep-100">{session?.user.firstName}</span>
              </span>
            )}
            <span className="font-primary font-medium text-[1.8rem] lg:text-[2.6rem] leading-10 lg:leading-12 text-black">
              {t("title")}
            </span>
          </div>
        )}
        <div className={`flex items-center gap-4 ${mobileSearch && "w-full"}`}>
          {mobileSearch && (
            <div
              className={
                "bg-neutral-100 w-full rounded-[30px] flex items-center justify-between lg:hidden px-6 py-4"
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
          <div className="flex items-center gap-4">
            <div
              className={
                "hidden bg-neutral-100 rounded-[30px] lg:flex items-center justify-between w-[24.3rem] px-6 py-4"
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
            <div className="w-[0.1rem] h-[1.8rem] bg-neutral-100"></div>
            {!mobileSearch && (
              <button
                onClick={() => setMobileSearch(!mobileSearch)}
                className={
                  "w-14 h-14 bg-neutral-100 rounded-full flex lg:hidden items-center justify-center"
                }
              >
                <SearchNormal size="20" color="#737c8a" variant="Bulk" />
              </button>
            )}
            {/* Liked */}
            {session?.user ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={"/explore/liked"}
                    className="w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full"
                  >
                    <Heart size={20} color="#737C8A" variant="Bulk" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-[1.2rem]">{t("liked")}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Dialog>
                <DialogTrigger>
                  <div className="w-14 h-14 cursor-pointer flex items-center justify-center bg-neutral-100 rounded-full">
                    <Heart size={20} color="#737C8A" variant="Bulk" />
                  </div>
                </DialogTrigger>
                <NoAuthDialog callbackUrl="/explore/liked" />
              </Dialog>
            )}
            {/* Wallet */}
            {/* {session && session?.user && (
              <Link
                href={"/wallet"}
                className="bg-neutral-200 text-black text-[1.4rem] hidden lg:flex gap-4 px-3 py-[6px] rounded-[3rem] items-center"
              >
                {TruncateUrl(
                  `${
                    session?.user?.userPreference?.currency === "USD"
                      ? wallet.usdAvailableBalance
                      : wallet.htgAvailableBalance
                  }`,
                  4,
                )}
                <span className="font-medium text-primary-500">
                  {session.user.userPreference.currency}
                </span>
                <AddCircle
                  size="24"
                  color="#E45B00"
                  variant="Bulk"
                  className="hidden lg:block"
                />
              </Link>
            )} */}
          </div>
        </div>
      </motion.header>
      {hasAnyEvents ? (
        <div className="pt-4 overflow-y-scroll flex flex-col gap-8 -mx-4">
          {filteredEvents.length > 0 && (
            <ul className="list pt-4 px-4 pb-8 lg:pb-0">
              {filteredEvents.map((event, index) => (
                <motion.li
                  key={event.eventId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    ease: "easeOut",
                    delay: Math.min(index * 0.06, 0.3),
                  }}
                  className="h-full flex"
                >
                  <EventCard event={event} htgExchangeRate={htgExchangeRate} />
                </motion.li>
              ))}
            </ul>
          )}
          {filteredRaffles.length > 0 && (
            <section className="flex flex-col gap-6">
              <span className="font-primary font-medium text-[1.8rem] lg:text-[2.2rem] leading-8 text-black lg:px-4">
                {t("raffles")}
              </span>
              <div className="-mx-4">
                <ul className="list pt-4 px-4 pb-8 lg:pb-0">
                  {filteredRaffles.map((raffle, index) => (
                    <motion.li
                      key={raffle.raffleId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.35,
                        ease: "easeOut",
                        delay: Math.min(index * 0.06, 0.3),
                      }}
                    >
                      <RaffleCard raffle={raffle} />
                    </motion.li>
                  ))}
                </ul>
              </div>
            </section>
          )}
          {filteredRestaurants.length > 0 && (
            <section className="flex flex-col gap-6">
              <span className="font-primary font-medium text-[1.8rem] lg:text-[2.2rem] leading-8 text-black px-4">
                {t("restaurants")}
              </span>
              <ul className="list pt-4 px-4 pb-8 lg:pb-0">
                {filteredRestaurants.map((restaurant, index) => (
                  <motion.li
                    key={restaurant.restaurantId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      ease: "easeOut",
                      delay: Math.min(index * 0.06, 0.3),
                    }}
                  >
                    <RestaurantCard restaurant={restaurant} />
                  </motion.li>
                ))}
              </ul>
            </section>
          )}
          {filteredPastEvents.length > 0 && (
            <section className="flex flex-col gap-6">
              <span className="font-primary font-medium text-[1.8rem] lg:text-[2.2rem] leading-8 text-black px-4">
                {t("pastActivities")}
              </span>
              <ul className="list opacity-70 pt-4 px-4 pb-8 lg:pb-0">
                {filteredPastEvents.map((event, index) => (
                  <motion.li
                    key={event.eventId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      ease: "easeOut",
                      delay: Math.min(index * 0.06, 0.3),
                    }}
                  >
                    <EventCard
                      event={event}
                      htgExchangeRate={htgExchangeRate}
                    />
                  </motion.li>
                ))}
              </ul>
            </section>
          )}
          <AnimatePresence>
            {noSearchResults && (
              <motion.div
                className="flex flex-col h-full justify-center items-center gap-12"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
              >
                <div className="h-48 w-48 bg-neutral-100 rounded-full flex items-center justify-center">
                  <div className="w-36 h-36 bg-neutral-200 flex items-center justify-center rounded-full">
                    <Ticket size="50" color="#0D0D0D" variant="Bulk" />
                  </div>
                </div>
                <span className="font-primary text-[1.8rem] text-center leading-8 text-neutral-600">
                  {t("noResult")} <span className="text-deep-100">{query}</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          className="w-132 lg:w-184 mx-auto h-full justify-center flex flex-col items-center gap-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div
            className={
              "w-48 h-48 rounded-full flex items-center justify-center bg-neutral-100"
            }
          >
            <div
              className={
                "w-36 h-36 rounded-full flex items-center justify-center bg-neutral-200"
              }
            >
              <Money3 size="50" color="#0d0d0d" variant="Bulk" />
            </div>
          </div>
          <div className={"flex flex-col gap-12 items-center text-center"}>
            <p
              className={
                "text-[1.8rem] leading-10 text-neutral-600 max-w-132 lg:max-w-[42.2rem]"
              }
            >
              {t("noEvent")}
            </p>
          </div>
        </motion.div>
      )}
    </>
  );
}
