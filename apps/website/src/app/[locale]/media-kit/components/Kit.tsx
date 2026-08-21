"use client";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Link } from "@/i18n/navigation";
import { DocumentDownload } from "iconsax-reactjs";

// Static asset served from apps/website/public. Drop the refreshed zip at that
// exact path; the filename stays stable so links shared with press keep working.
const MEDIA_KIT_FILE = "/media-kit/ticketwaze-media-kit.zip";

export default function Kit() {
  const t = useTranslations("MediaKitPage.kit");
  return (
    <section className="bg-white py-[3rem] lg:py-[7.5rem] px-[1.5rem] lg:px-[10rem] rounded-[3rem] flex flex-col items-center lg:items-start gap-[3.5rem] lg:gap-[75px]">
      <div className="flex flex-col gap-8 max-w-[850px]">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-primary font-bold text-[3.2rem] lg:text-[4.5rem] leading-[32px] lg:leading-[50px] text-deep-200 max-w-[750px]"
        >
          {t("title1")} <span className="text-primary-500">{t("title2")}</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="font-sans text-[1.8rem] lg:text-[2.6rem] leading-[2.5rem] lg:leading-[3.5rem] text-neutral-600"
        >
          {t("description")}
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full bg-primary-500 rounded-[3rem] p-[3rem] lg:p-[5rem] flex flex-col lg:flex-row lg:items-center justify-between gap-[3.5rem] lg:gap-[50px]"
      >
        <div className="flex flex-col gap-[1.5rem] max-w-[550px]">
          <span className="font-primary font-bold text-[3.2rem] lg:text-[4.5rem] leading-[35px] lg:leading-[50px] text-white">
            {t("download.title")}
          </span>
          <span className="font-sans text-[1.8rem] leading-[25px] text-neutral-200">
            {t("download.description")}
          </span>
        </div>
        <div className="flex flex-col gap-8 items-start shrink-0">
          <a
            href={MEDIA_KIT_FILE}
            download
            // nextjs-toploader starts its bar on any same-origin anchor click and
            // only clears it on a route change, so a download would leave it stuck
            // at the top of the page. An explicit target makes the loader finish the
            // bar on the spot. It does not change how the download behaves.
            target="_self"
            className="px-12 py-8 rounded-[10rem] bg-white text-primary-500 text-[1.5rem] font-medium leading-8 flex items-center gap-4"
          >
            <DocumentDownload size="20" color="#E45B00" variant="Bulk" />
            <span>{t("download.cta")}</span>
          </a>
          <span className="font-mono text-[1.4rem] leading-8 text-neutral-200">
            {t("download.meta")}
          </span>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="font-sans text-[1.8rem] leading-[25px] text-neutral-700"
      >
        {t("help.text")}{" "}
        <Link href="/contact" className="text-primary-500 font-medium">
          {t("help.cta")}
        </Link>
      </motion.p>
    </section>
  );
}
