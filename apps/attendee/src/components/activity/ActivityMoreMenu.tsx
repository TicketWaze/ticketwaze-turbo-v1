"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { MoreCircle } from "iconsax-reactjs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import ReportEventComponent from "@/app/[locale]/explore/[slug]/ReportEventComponent";
import ReportOrganisationComponent from "@/app/[locale]/explore/[slug]/ReportOrganisationComponent";

/**
 * The ⋯ button next to Share/Save (Figma "More" menu): report the activity or
 * its organisation. Shared by every activity page.
 */
export default function ActivityMoreMenu({
  activityId,
  organisationId,
  extra,
}: {
  activityId: string;
  organisationId: string;
  /** Rows above the report ones, e.g. Upcoming's "More information". */
  extra?: React.ReactNode;
}) {
  const t = useTranslations("Event");
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={t("more")}
        className="w-fit h-fit p-[7.5px] flex items-center justify-center bg-neutral-100 rounded-[30px] cursor-pointer hover:bg-primary-100 active:scale-90 transition-all duration-300"
      >
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex"
        >
          <MoreCircle
            variant="Bulk"
            color={open ? "#E45B00" : "#737C8A"}
            size={20}
          />
        </motion.span>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[22rem] p-[10px] bg-white border border-neutral-100 rounded-[10px] shadow-[0px_5px_10px_0px_rgba(0,0,0,0.1)] flex flex-col gap-1"
      >
        <span className="px-[10px] pt-[2px] pb-[8px] mb-1 border-b border-neutral-100 text-[1.4rem] font-medium leading-8 text-deep-100">
          {t("more")}
        </span>
        {extra && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {extra}
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <ReportEventComponent
            activityId={activityId}
            organisationId={organisationId}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.04 }}
        >
          <ReportOrganisationComponent organisationId={organisationId} />
        </motion.div>
      </PopoverContent>
    </Popover>
  );
}
