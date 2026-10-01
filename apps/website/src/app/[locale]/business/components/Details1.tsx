"use client";
import { useTranslations } from "next-intl";
import Building from "@/assets/images/building.png";
import PinnedAccordion from "@/components/PinnedAccordion";

/** "What businesses can do with Ticketwaze". */
export default function Details1() {
  const t = useTranslations("BusinessPage.details1");
  const panel = (key: string, number: string) => ({
    title: t(`${key}.title`),
    number,
    description: [t(`${key}.1`), t(`${key}.2`), t(`${key}.3`)],
  });
  return (
    <PinnedAccordion
      title={t("title")}
      image={Building}
      imageSide="right"
      theme={{
        section: "bg-deep-200",
        collapsedBg: "#2e3237",
        collapsedText: "text-neutral-400",
        openTitle: "text-deep-200",
        openNumber: "text-neutral-700",
        openText: "text-neutral-700",
        collapsedHeight: 100,
        columnHeight: 699,
      }}
      panels={[
        panel("first", "01"),
        panel("second", "02"),
        panel("third", "03"),
        panel("fourth", "04"),
      ]}
    />
  );
}
