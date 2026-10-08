"use client";
import { useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft2, ArrowRight2 } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import AppCta from "@/components/AppCta";
import { usePinnedSteps } from "@/hooks/usePinnedSteps";

const COLLAPSED_WIDTH_PX = 150;
const GAP_PX = 25;
const MARGIN_PX = 2;

/**
 * "From Discovery to Access All in One Flow".
 *
 * On desktop the section pins and the open card advances 01 → 02 → 03 as the
 * page scrolls; the arrows and the cards themselves scroll to a step too.
 * Below lg the three cards are simply listed.
 */
export default function Details3() {
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

  const {
    trackRef,
    sectionRef,
    pinTop,
    step: index,
    goTo,
    reduceMotion,
    spacerHeight,
  } = usePinnedSteps(items.length);

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
    <div ref={trackRef} className="relative">
      <section
        ref={sectionRef}
        style={{ top: pinTop }}
        className="lg:sticky bg-white py-12 lg:pt-[clamp(5rem,9vh,10rem)] lg:pb-[clamp(4rem,8vh,8.5rem)] px-6 lg:px-40 rounded-[3rem] flex flex-col gap-14 lg:gap-[clamp(5rem,9vh,10rem)]"
      >
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-[20px]">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-primary font-bold text-[3.2rem] lg:text-[4.5rem] leading-[3.2rem] lg:leading-20 text-deep-200 lg:w-[480px] shrink-0"
          >
            {t("title")}
          </motion.h2>
          <div className="flex flex-1 flex-col items-start gap-8 lg:gap-14">
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="font-sans text-[1.8rem] lg:text-[2.6rem] leading-[2.5rem] lg:leading-14 text-neutral-700"
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
              <AppCta variant="started" />
            </motion.div>
          </div>
        </div>
        <div className="hidden lg:flex flex-col gap-12">
          <div
            ref={containerRef}
            className="overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="flex gap-10" style={{ width: "fit-content" }}>
              {items.map(({ description, id, number, title }, i) => (
                <motion.button
                  key={id}
                  onClick={() => goTo(i)}
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
                  transition={{
                    duration: reduceMotion ? 0 : 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="shrink-0 h-[clamp(28rem,calc(74vh-32rem),48rem)] cursor-pointer"
                >
                  <div
                    className={`h-full ${id === 1 && "bg-[#FFEFE2]"} ${id === 2 && "bg-[#68AAF9]"} ${id === 3 && "bg-[#F58CB7]"} rounded-[30px] w-full p-[5rem] flex flex-col justify-between items-start`}
                  >
                    <span
                      className={`${number === "01" && "text-primary-900"} ${number === "02" && "text-[#34557D]"} ${number === "03" && "text-[#7B465C]"} font-primary font-bold text-[4.5rem] leading-[5rem]`}
                    >
                      {number}
                    </span>
                    <AnimatePresence>
                      {i === index && (
                        <motion.div
                          initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: 0.35,
                            delay: reduceMotion ? 0 : 0.2,
                          }}
                          className="flex flex-col items-start gap-[1.5rem] max-w-[740px]"
                        >
                          <span
                            className={`${number === "01" && "text-primary-900"} ${number === "02" && "text-[#34557D]"} ${number === "03" && "text-[#7B465C]"} font-semibold text-[3.5rem] leading-[3.5rem] tracking-[-1.05px] text-left font-primary`}
                          >
                            {title}
                          </span>
                          <p
                            className={`${number === "01" && "text-primary-900"} ${number === "02" && "text-[#34557D]"} ${number === "03" && "text-[#7B465C]"} font-sans text-[1.8rem] leading-[2.5rem] tracking-[-0.54px] text-left`}
                          >
                            {description}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-8">
            <motion.button
              disabled={index === 0}
              onClick={() => goTo(index - 1)}
              aria-label="Previous"
              className="w-[100px] h-[60px] border border-primary-400 bg-primary-50 rounded-[100px] flex items-center justify-center cursor-pointer transition-opacity duration-300 disabled:opacity-50 disabled:cursor-default"
            >
              <ArrowLeft2 size="35" color="#E45B00" variant="Bulk" />
            </motion.button>
            <motion.button
              disabled={index === items.length - 1}
              onClick={() => goTo(index + 1)}
              aria-label="Next"
              className="w-[100px] h-[60px] border border-primary-400 bg-primary-50 rounded-[100px] flex items-center justify-center cursor-pointer transition-opacity duration-300 disabled:opacity-50 disabled:cursor-default"
            >
              <ArrowRight2 size="35" color="#E45B00" variant="Bulk" />
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
      </section>
      {/* Scroll room for the pinned steps. */}
      <div
        aria-hidden
        className="hidden lg:block"
        style={{ height: spacerHeight }}
      />
    </div>
  );
}
