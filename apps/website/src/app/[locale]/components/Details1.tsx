"use client";
import Image, { type StaticImageData } from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import Zap from "@/assets/icons/zap.svg";
import cards from "@/assets/icons/cards.svg";
import folderBookmark from "@/assets/icons/folderBookmark.svg";
import share from "@/assets/icons/share.svg";
import addColumn from "@/assets/icons/addColumn.svg";
import pie from "@/assets/icons/pie.svg";
import gear from "@/assets/icons/gear.svg";
import rocket from "@/assets/icons/rocket.svg";
import bg from "@/assets/images/details-card-bg.svg";
import { usePinnedSteps } from "@/hooks/usePinnedSteps";

type Item = { id: string; title: string; image: StaticImageData };

const CARDS_PER_STEP = 2;

/**
 * "Everything Ticketing, Made Simple".
 *
 * On desktop the section pins while the page scrolls past it and steps through
 * Personal 01-02, 03-04, then Business 01-02, 03-04; the tab on the left
 * follows. Clicking a tab scrolls to its first step. Below lg there is no
 * pinning: the tabs switch between the two groups and every card is listed.
 */
export default function Details1() {
  const t = useTranslations("HomePage.details1");
  const groups: { id: string; title: string; items: Item[] }[] = [
    {
      id: "personal",
      title: t("personal.title"),
      items: [
        { id: "01", title: t("personal.item1"), image: Zap },
        { id: "02", title: t("personal.item2"), image: cards },
        { id: "03", title: t("personal.item3"), image: folderBookmark },
        { id: "04", title: t("personal.item4"), image: share },
      ],
    },
    {
      id: "business",
      title: t("business.title"),
      items: [
        { id: "01", title: t("business.item1"), image: addColumn },
        { id: "02", title: t("business.item2"), image: pie },
        { id: "03", title: t("business.item3"), image: gear },
        { id: "04", title: t("business.item4"), image: rocket },
      ],
    },
  ];
  const stepsPerGroup = groups[0].items.length / CARDS_PER_STEP;
  const stepCount = groups.length * stepsPerGroup;

  const {
    trackRef,
    sectionRef,
    pinTop,
    step,
    direction,
    goTo,
    reduceMotion,
    spacerHeight,
  } = usePinnedSteps(stepCount);

  const activeGroup = Math.floor(step / stepsPerGroup);
  const page = step % stepsPerGroup;

  const offset = reduceMotion ? 0 : 40;
  const visibleItems = groups[activeGroup].items.slice(
    page * CARDS_PER_STEP,
    page * CARDS_PER_STEP + CARDS_PER_STEP,
  );

  return (
    <div ref={trackRef} className="relative">
      <section
        ref={sectionRef}
        style={{ top: pinTop }}
        className="lg:sticky w-full bg-white py-[3rem] lg:py-[7.5rem] px-[1.5rem] lg:px-[10rem] rounded-[3rem]"
      >
        <div className="flex flex-col lg:flex-row justify-between gap-[3.5rem] lg:gap-[7.5rem]">
          <div className="flex flex-col gap-[3.5rem] justify-between w-full lg:max-w-[518px]">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="font-primary font-bold text-[3.2rem] lg:text-[4.5rem] leading-[35px] lg:leading-[50px] text-deep-200 lg:max-w-[460px]"
            >
              {t("title")}
            </motion.h2>
            <div role="tablist" className="flex flex-col gap-[15px] lg:gap-8">
              {groups.map(({ id, title }, index) => {
                const active = index === activeGroup;
                return (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => goTo(index * stepsPerGroup)}
                    className={`rounded-[2rem] cursor-pointer py-[15px] lg:py-8 px-[3rem] text-left font-medium font-primary text-[2.6rem] lg:text-[3.8rem] leading-[30px] lg:leading-[45px] transition-colors duration-500 ${
                      active
                        ? "bg-primary-500 text-white"
                        : "bg-neutral-100 text-deep-100 hover:bg-neutral-200"
                    }`}
                  >
                    {title}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="w-[5px] hidden lg:block h-auto bg-neutral-100 shrink-0"></div>

          {/* Desktop: two cards per step, swapped as the page scrolls. The column
              is 874px tall as designed, shorter when the window is, so the
              whole section stays in view while pinned. */}
          <div className="hidden lg:block relative flex-1 max-w-[542px] h-[clamp(46rem,calc(100vh-23rem),87.4rem)] overflow-hidden">
            <AnimatePresence
              initial={false}
              custom={direction}
              mode="popLayout"
            >
              <motion.div
                key={step}
                custom={direction}
                variants={{
                  enter: (dir: number) => ({ opacity: 0, y: dir * offset }),
                  center: { opacity: 1, y: 0 },
                  exit: (dir: number) => ({ opacity: 0, y: -dir * offset }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 flex flex-col gap-8"
              >
                {visibleItems.map((item) => (
                  <Card key={item.id} {...item} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mobile: every card of the selected group. */}
          <div className="lg:hidden flex flex-col gap-[15px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeGroup}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-[15px]"
              >
                {groups[activeGroup].items.map((item) => (
                  <Card key={item.id} {...item} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
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

function Card({ id, title, image }: Item) {
  return (
    <div className="bg-neutral-100 w-full h-[330px] lg:h-auto lg:flex-1 lg:min-h-0 rounded-[3rem] flex flex-col gap-[20px] lg:gap-[clamp(2rem,4vh,5.5rem)] overflow-hidden shrink-0">
      <div
        className="relative flex-1 min-h-0 bg-no-repeat bg-center bg-[length:542px_262px]"
        style={{ backgroundImage: `url(${bg.src})` }}
      >
        <Image
          src={image}
          alt=""
          className="absolute top-[50%] left-[50%] -translate-y-[50%] -translate-x-[50%]"
        />
      </div>
      <div className="flex flex-col gap-[10px] lg:gap-8 px-[3rem] pb-12">
        <span className="font-sans font-semibold text-[2.2rem] leading-[3rem] text-neutral-700">
          {id}
        </span>
        <span className="font-semibold font-sans uppercase text-[2.2rem] leading-[30px] text-black">
          {title}
        </span>
      </div>
    </div>
  );
}
