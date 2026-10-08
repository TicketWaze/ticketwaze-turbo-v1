"use client";
import { ArchiveMinus, CloseCircle, SearchNormal } from "iconsax-reactjs";
import { motion } from "framer-motion";
import { useState } from "react";
import { useTranslations } from "next-intl";
import NotificationBell from "@/components/NotificationBell";
import { Link } from "@/i18n/navigation";

/**
 * Figma's list-page header (Upcoming, History): the title, then search, a
 * divider, the notification bell and Saved. On mobile the search collapses to
 * a button that swaps the title for a full-width field.
 */
export default function ListPageHeader({
  title,
  searchPlaceholder,
  onSearch,
}: {
  title: string;
  searchPlaceholder: string;
  onSearch: (query: string) => void;
}) {
  const tExplore = useTranslations("Explore");
  const [mobileSearch, setMobileSearch] = useState(false);
  return (
    <motion.header
      className="w-full flex items-center justify-between"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {!mobileSearch && (
        <h1 className="min-w-0 truncate font-primary font-medium text-[1.8rem] lg:text-[2.6rem] leading-10 lg:leading-12 text-black">
          {title}
        </h1>
      )}
      <div className={`flex shrink-0 items-center gap-3 lg:gap-4 ${mobileSearch && "w-full"}`}>
        {mobileSearch && (
          <div
            className={
              "bg-neutral-100 w-full rounded-[30px] flex items-center justify-between lg:hidden px-6 py-4"
            }
          >
            <input
              placeholder={searchPlaceholder}
              className={
                "text-black font-normal text-[1.4rem] leading-8 w-full outline-none"
              }
              autoFocus
              onChange={(e) => onSearch(e.target.value)}
            />
            <button
              onClick={() => {
                setMobileSearch(false);
                onSearch("");
              }}
            >
              <CloseCircle size="20" color="#737c8a" variant="Bulk" />
            </button>
          </div>
        )}
        <div
          className={
            "hidden bg-neutral-100 rounded-[30px] lg:flex items-center justify-between w-[24.3rem] px-6 py-4"
          }
        >
          <input
            placeholder={searchPlaceholder}
            className={
              "text-black font-normal text-[1.4rem] leading-8 w-full outline-none"
            }
            onChange={(e) => onSearch(e.target.value)}
          />
          <SearchNormal size="20" color="#737c8a" variant="Bulk" />
        </div>
        {!mobileSearch && (
          <>
            <div className="w-[0.1rem] h-[1.8rem] bg-neutral-100 hidden lg:block" />
            <NotificationBell />
            <Link
              href="/explore/liked"
              aria-label={tExplore("saved")}
              title={tExplore("saved")}
              className="w-12 h-12 lg:w-14 lg:h-14 shrink-0 flex items-center justify-center bg-neutral-100 rounded-full transition-transform active:scale-90"
            >
              <ArchiveMinus size={20} color="#737C8A" variant="Bulk" />
            </Link>
            <button
              onClick={() => setMobileSearch(true)}
              aria-label={searchPlaceholder}
              className={
                "w-12 h-12 shrink-0 bg-neutral-100 rounded-full flex lg:hidden items-center justify-center"
              }
            >
              <SearchNormal size="20" color="#737c8a" variant="Bulk" />
            </button>
          </>
        )}
      </div>
    </motion.header>
  );
}
