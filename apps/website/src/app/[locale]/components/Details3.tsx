"use client";
import { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { Link } from "@/i18n/navigation";
import { ArrowLeft2, ArrowRight2, Timer1 } from "iconsax-reactjs";
import { useTranslations } from "next-intl";

const COLLAPSED_WIDTH_PX = 150;
const GAP_PX = 25;
const MARGIN_PX = 2;

export default function Details3() {
  const [index, setIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [fullWidthPx, setFullWidthPx] = useState<number>(640);
  const t = useTranslations("HomePage.details3");

  const items = [
    {
      id: 1,
      number: "01",
      title: t("first.title"),
      description: t("first.description"),
      background: "#FFEFE2",
    },
    {
      id: 2,
      number: "02",
      title: t("second.title"),
      description: t("second.description"),
      background: "#68AAF9",
    },
    {
      id: 3,
      number: "03",
      title: t("third.title"),
      description: t("third.description"),
      background: "#F58CB7",
    },
  ];

  useEffect(() => {
    const calculateWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        // Calculate: containerWidth - (collapsed cards * width) - (gaps between cards) - (margins)
        const collapsedCount = items.length - 1;
        const totalCollapsedWidth = collapsedCount * COLLAPSED_WIDTH_PX;
        const totalGaps = (items.length - 1) * GAP_PX;
        const totalMargins = MARGIN_PX * 2;
        const calculatedFullWidth =
          containerWidth - totalCollapsedWidth - totalGaps - totalMargins;

        setFullWidthPx(Math.max(calculatedFullWidth, 400)); // minimum 400px
      }
    };

    calculateWidth();
    window.addEventListener("resize", calculateWidth);
    return () => window.removeEventListener("resize", calculateWidth);
  }, [items.length]);

  return (
    <section className="bg-white py-[3rem] lg:py-[7.5rem] px-[1.5rem] lg:px-[10rem] rounded-[3rem] flex flex-col gap-[3.5rem] lg:gap-[10rem]">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-4">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-primary font-bold text-[3.2rem] lg:text-[4.5rem] leading-[32px] lg:leading-[50px] text-deep-200 max-w-[480px]"
        >
          {t("title")}
        </motion.h2>
        <div className="flex flex-col items-start gap-8 lg:gap-[3.5rem]">
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="font-sans  text-[2.6rem] leading-[3.5rem] text-neutral-700"
          >
            {t("description1")}{" "}
            <span className="text-deep-100">{t("description2")}</span>{" "}
            {t("description3")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {/* <Link
              href={process.env.NEXT_PUBLIC_ATTENDEE_URL!}
              className="px-[1.5rem] w-[175px] py-[7.5px] border border-[#E45B00] bg-[#fee7d5] rounded-[100px] flex items-center justify-between "
            >
              <span className="font-medium font-sans text-[1.5rem] text-primary-500">
                {t("cta.started")}
              </span>
              <ArrowRight2 size="20" color="#E45B00" variant="Bulk" />
            </Link> */}
            <Link
              href={"/waitlist"}
              className="px-[3rem] py-[7.5px] border border-[#E45B00] bg-[#fee7d5] rounded-[100px] flex items-center gap-4"
            >
              <Timer1 size="20" color="#E45B00" variant="Bulk" />
              <span className="font-medium font-sans text-[1.5rem] text-primary-500">
                {t("cta.waitlist")}
              </span>
            </Link>
          </motion.div>
        </div>
      </div>
      <div className="hidden lg:flex flex-col gap-12">
        <div
          ref={containerRef}
          className="overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex gap-[25px]" style={{ width: "fit-content" }}>
            {items.map(({ description, id, number, title }, i) => (
              <motion.button
                key={id}
                onClick={() => setIndex(i)}
                initial={false}
                animate={i === index ? "active" : "inactive"}
                variants={{
                  active: {
                    width: fullWidthPx,
                    marginLeft: MARGIN_PX,
                    marginRight: MARGIN_PX,
                  },
                  inactive: {
                    width: COLLAPSED_WIDTH_PX,
                    marginLeft: 0,
                    marginRight: 0,
                  },
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="shrink-0 h-[480px]"
              >
                <div
                  className={`h-[480px] ${id === 1 && "bg-[#FFEFE2]"} ${id === 2 && "bg-[#68AAF9]"} ${id === 3 && "bg-[#F58CB7]"} rounded-[30px] w-full p-[5rem] flex flex-col justify-between items-start`}
                >
                  <span
                    className={`${number === "01" && "text-primary-900"} ${number === "02" && "text-[#34557D]"} ${number === "03" && "text-[#7B465C]"} font-bold text-[4.5rem] leading-[5rem]`}
                  >
                    {number}
                  </span>
                  {i === index && (
                    <div className="flex flex-col items-start gap-[1.5rem]">
                      <span
                        className={`${number === "01" && "text-primary-900"} ${number === "02" && "text-[#34557D]"} ${number === "03" && "text-[#7B465C]"} font-semibold text-[3.5rem] leading-[3.5rem] text-left`}
                      >
                        {title}
                      </span>
                      <p
                        className={`${number === "01" && "text-primary-900"} ${number === "02" && "text-[#34557D]"} ${number === "03" && "text-[#7B465C]"} font-sans text-[1.8rem] leading-[2.5rem] text-left`}
                      >
                        {description}
                      </p>
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Navigation buttons remain the same */}
        <div className="flex items-center gap-8">
          <motion.button
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="px-[1.5rem] py-[7.5px] border border-[#E45B00] bg-[#fee7d5] rounded-[100px] flex items-center justify-between cursor-pointer"
          >
            <ArrowLeft2 size="20" color="#E45B00" variant="Bulk" />
          </motion.button>
          <motion.button
            disabled={index === items.length - 1}
            onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
            className="px-[1.5rem] py-[7.5px] border border-[#E45B00] bg-[#fee7d5] rounded-[100px] flex items-center justify-between cursor-pointer"
          >
            <ArrowRight2 size="20" color="#E45B00" variant="Bulk" />
          </motion.button>
        </div>
      </div>
      <ul className="flex lg:hidden flex-col gap-[1.5rem]">
        {items.map(({ description, id, number, title }) => {
          return (
            <motion.li
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              key={id}
              className={`p-8 flex flex-col gap-[5rem] ${id === 1 && "bg-[#FFEFE2]"} ${id === 2 && "bg-[#68AAF9]"} ${id === 3 && "bg-[#F58CB7]"} rounded-[2rem]`}
            >
              <span
                className={`${number === "01" && "text-primary-900"} ${number === "02" && "text-[#34557D]"} ${number === "03" && "text-[#7B465C]"} font-bold text-[3.5rem] leading-[5rem]`}
              >
                {number}
              </span>
              <div className="flex flex-col items-start gap-[1.5rem]">
                <span
                  className={`${number === "01" && "text-primary-900"} ${number === "02" && "text-[#34557D]"} ${number === "03" && "text-[#7B465C]"} font-semibold text-[2.6rem] leading-[3.5rem] text-left`}
                >
                  {title}
                </span>
                <p
                  className={`${number === "01" && "text-primary-900"} ${number === "02" && "text-[#34557D]"} ${number === "03" && "text-[#7B465C]"} font-sans text-[1.8rem] leading-[2.5rem] text-left`}
                >
                  {description}
                </p>
              </div>
            </motion.li>
          );
        })}
      </ul>
      ;
    </section>
  );
}
