"use client";
import { useTranslations } from "next-intl";
import Girls from "@/assets/images/details-1-personal.png";
import PinnedAccordion from "@/components/PinnedAccordion";

/** "Where tickets, payments, and access come together". */
export default function Details1() {
  const t = useTranslations("PersonalPage.details1");
  return (
    <PinnedAccordion
      title={t("title")}
      image={Girls}
      imageSide="left"
      theme={{
        section: "bg-primary-500",
        collapsedBg: "#af3200",
        collapsedText: "text-primary-50",
        openTitle: "text-primary-500",
        openNumber: "text-primary-900",
        openText: "text-primary-900",
        collapsedHeight: 120,
        columnHeight: 650,
      }}
      panels={[
        {
          title: t("first.title"),
          number: "01",
          description: [
            t("first.1"),
            t("first.2"),
            t("first.3"),
            t("first.4"),
            t("first.5"),
            t("first.6"),
          ],
        },
        {
          title: t("second.title"),
          number: "02",
          description: [
            t("second.1"),
            t("second.2"),
            t("second.3"),
            t("second.4"),
          ],
        },
        {
          title: t("third.title"),
          number: "03",
          description: [t("third.1"), t("third.2"), t("third.3")],
        },
      ]}
    />
  );
}
