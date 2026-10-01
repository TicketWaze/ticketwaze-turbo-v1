"use client";
import { AnimatePresence, motion } from "motion/react";
import Image, { type StaticImageData } from "next/image";
import { usePinnedSteps } from "@/hooks/usePinnedSteps";
import { cn } from "@/lib/utils";

export type AccordionPanel = {
  title: string;
  number: string;
  description: string[];
};

export type AccordionTheme = {
  /** Section background, e.g. "bg-primary-500". */
  section: string;
  /** Collapsed panel background as a colour, animated to white when open. */
  collapsedBg: string;
  /** Text colour of a collapsed panel's title and number. */
  collapsedText: string;
  /** Open panel title, number and list text colours. */
  openTitle: string;
  openNumber: string;
  openText: string;
  /** Collapsed panel height on desktop, in px. */
  collapsedHeight: number;
  /** Panel column height on desktop as designed, in px. */
  columnHeight: number;
};

/**
 * A photo beside a column of numbered panels, one open at a time (the Personal
 * and Business pages).
 *
 * On desktop the section pins and the open panel advances as the page scrolls;
 * clicking a panel scrolls to it. The column is `columnHeight` tall as
 * designed, shorter when the window is, so the whole section stays in view
 * while pinned. Below lg the photo is followed by every panel, open.
 */
export default function PinnedAccordion({
  title,
  panels,
  image,
  imageSide,
  theme,
}: {
  title: string;
  panels: AccordionPanel[];
  image: StaticImageData;
  imageSide: "left" | "right";
  theme: AccordionTheme;
}) {
  const {
    trackRef,
    sectionRef,
    pinTop,
    step,
    goTo,
    reduceMotion,
    spacerHeight,
  } = usePinnedSteps(panels.length);
  const transition = {
    duration: reduceMotion ? 0 : 0.5,
    ease: [0.22, 1, 0.36, 1] as const,
  };
  // At least the collapsed panels plus room for an open one (280px). At most
  // the window minus the title (100px), the section's padding and gap (225px)
  // and the 40px kept above and below the pinned section.
  const minColumn = (panels.length - 1) * (theme.collapsedHeight + 25) + 280;
  const columnHeight = `clamp(${minColumn}px, calc(100vh - 405px), ${theme.columnHeight}px)`;

  const photo = (
    <div className="relative flex-1 max-w-[592px] rounded-[30px] overflow-hidden bg-primary-50">
      <Image src={image} alt="" fill sizes="592px" className="object-cover" />
    </div>
  );

  return (
    <div ref={trackRef} className="relative">
      <section
        ref={sectionRef}
        style={{ top: pinTop }}
        className={cn(
          "lg:sticky py-[3rem] lg:py-[7.5rem] px-[1.5rem] lg:px-[10rem] rounded-[3rem] flex flex-col items-center lg:items-start gap-[3.5rem] lg:gap-[75px]",
          theme.section,
        )}
      >
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-primary font-bold text-[3.2rem] lg:text-[4.5rem] leading-[35px] lg:leading-[50px] text-white max-w-[690px]"
        >
          {title}
        </motion.h2>

        <div
          className="hidden lg:flex w-full gap-[2.5rem]"
          style={{ height: columnHeight }}
        >
          {imageSide === "left" && photo}
          <div className="flex-1 flex flex-col gap-[2.5rem]">
            {panels.map(({ title, number, description }, i) => {
              const active = i === step;
              return (
                <motion.div
                  key={number}
                  layout
                  transition={transition}
                  initial={false}
                  animate={{
                    backgroundColor: active ? "#ffffff" : theme.collapsedBg,
                  }}
                  style={active ? undefined : { height: theme.collapsedHeight }}
                  className={cn(
                    "rounded-[30px] px-[30px] flex flex-col overflow-hidden",
                    active
                      ? "flex-1 justify-between py-[30px]"
                      : "shrink-0 justify-center",
                  )}
                >
                  <motion.button
                    layout="position"
                    transition={transition}
                    onClick={() => goTo(i)}
                    aria-expanded={active}
                    className="w-full flex items-center justify-between gap-8 font-semibold text-[2.2rem] leading-[30px] uppercase cursor-pointer text-left"
                  >
                    <span
                      className={active ? theme.openTitle : theme.collapsedText}
                    >
                      {title}
                    </span>
                    <span
                      className={
                        active ? theme.openNumber : theme.collapsedText
                      }
                    >
                      {number}
                    </span>
                  </motion.button>
                  <AnimatePresence initial={false}>
                    {active && (
                      <motion.ul
                        initial={{ opacity: 0, y: reduceMotion ? 0 : 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                        transition={{
                          duration: 0.35,
                          delay: reduceMotion ? 0 : 0.25,
                        }}
                        className={cn(
                          "list-disc ps-[37.5px] text-[2.5rem] tracking-[-0.75px]",
                          theme.openText,
                        )}
                      >
                        {description.map((des) => (
                          <li key={des}>{des}</li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
          {imageSide === "right" && photo}
        </div>

        <div className="flex lg:hidden flex-col gap-[1.5rem] w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Image
              src={image}
              alt=""
              className="w-full h-[300px] object-cover rounded-[3rem]"
            />
          </motion.div>
          {panels.map(({ description, number, title }) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              key={number}
              className="min-h-[280px] bg-white p-8 rounded-[3rem] flex flex-col justify-between gap-8"
            >
              <div className="font-semibold text-[2rem] leading-12 flex justify-between gap-8 w-full items-center uppercase">
                <span className={theme.openTitle}>{title}</span>
                <span className={theme.openNumber}>{number}</span>
              </div>
              <ul
                className={cn(
                  "list-disc ps-[2.5rem] text-[1.8rem] tracking-[-0.54px]",
                  theme.openText,
                )}
              >
                {description.map((des) => (
                  <li key={des}>{des}</li>
                ))}
              </ul>
            </motion.div>
          ))}
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
