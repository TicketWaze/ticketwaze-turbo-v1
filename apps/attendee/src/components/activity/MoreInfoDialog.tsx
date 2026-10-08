"use client";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { CloseCircle, InfoCircle } from "iconsax-reactjs";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ContactInfo from "./ContactInfo";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Figma "Upcoming events - open - more info": the ⋯ menu row that opens the
 * activity's About text and the organiser's contact details, which the ticket
 * page keeps off-screen so the map and ticket have the room.
 */
export default function MoreInfoDialog({
  aboutHtml,
  email,
  phone,
  website,
}: {
  aboutHtml: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
}) {
  const t = useTranslations("Event");
  return (
    <Dialog>
      <DialogTrigger className="w-full text-left">
        <span className="w-full flex items-center gap-4 px-[10px] py-[8px] rounded-[7.5px] cursor-pointer hover:bg-neutral-100 transition-colors">
          <InfoCircle size="18" color="#2E3237" variant="Bulk" />
          <span className="text-[1.4rem] leading-8 text-deep-100">
            {t("moreInfo")}
          </span>
        </span>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="gap-0 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-neutral-100">
          <DialogTitle className="font-primary font-medium text-[2.2rem] leading-10 text-black">
            {t("moreInfoTitle")}
          </DialogTitle>
          <DialogClose
            aria-label={t("close")}
            className="cursor-pointer active:scale-90 transition-transform"
          >
            <CloseCircle size={28} color="#737C8A" variant="Bulk" />
          </DialogClose>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05, ease }}
          className="flex flex-col gap-4 pt-8"
        >
          <DialogDescription className="font-semibold text-[1.6rem] leading-8 text-deep-100">
            {t("about")}
          </DialogDescription>
          <div
            className="rich-text text-[1.5rem] leading-9 text-neutral-700"
            dangerouslySetInnerHTML={{ __html: aboutHtml }}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.12, ease }}
          className="pt-10"
        >
          <ContactInfo email={email} phone={phone} website={website} />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
