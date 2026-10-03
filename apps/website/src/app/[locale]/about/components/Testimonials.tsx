"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { ArrowLeft2, ArrowRight2 } from "iconsax-reactjs";

/**
 * "Trusted by people and businesses".
 *
 * On desktop the cards sit in a row that scrolls sideways, snapping to each
 * card; the arrows only appear when the row overflows (a narrow desktop window,
 * or once there are more testimonials than fit). Below lg the cards stack.
 */
export default function Testimonials() {
  const t = useTranslations("AboutPage.testimonials");
  const items = [
    {
      id: 1,
      description: t("first.description"),
      name: t("first.name"),
      role: t("first.role"),
    },
    {
      id: 2,
      description: t("second.description"),
      name: t("second.name"),
      role: t("second.role"),
    },
    {
      id: 3,
      description: t("third.description"),
      name: t("third.name"),
      role: t("third.role"),
    },
  ];

  const rowRef = useRef<HTMLUListElement | null>(null);
  const [scroll, setScroll] = useState({
    overflows: false,
    atStart: true,
    atEnd: true,
  });

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const update = () =>
      setScroll({
        overflows: row.scrollWidth > row.clientWidth + 1,
        atStart: row.scrollLeft <= 1,
        atEnd: row.scrollLeft + row.clientWidth >= row.scrollWidth - 1,
      });
    update();
    row.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(row);
    return () => {
      row.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  const page = (direction: 1 | -1) => {
    const row = rowRef.current;
    const card = row?.firstElementChild as HTMLElement | null;
    if (!row || !card) return;
    // One card plus the 30px gap per click.
    row.scrollBy({
      left: direction * (card.offsetWidth + 30),
      behavior: "smooth",
    });
  };

  const arrowClass =
    "w-[100px] h-[60px] border border-primary-400 bg-primary-50 rounded-[100px] flex items-center justify-center cursor-pointer transition-opacity duration-300 disabled:opacity-50 disabled:cursor-default";

  return (
    <section className="bg-deep-300 py-[3rem] lg:pt-[7.5rem] lg:pb-[6.8rem] px-[1.5rem] lg:px-[10rem] rounded-[3rem] flex flex-col items-center lg:items-start gap-[3.5rem] lg:gap-[56px]">
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="font-primary font-bold text-[3.2rem] lg:text-[4.5rem] leading-[35px] lg:leading-[50px] text-white max-w-[480px]"
      >
        {t("title")}
      </motion.h2>
      <div className="flex flex-col gap-[51px] w-full">
        <ul
          ref={rowRef}
          className="flex flex-col lg:flex-row gap-[1.5rem] lg:gap-[30px] lg:overflow-x-auto lg:snap-x lg:snap-mandatory [scrollbar-width:none]"
        >
          {items.map(({ description, id, name, role }) => (
            <motion.li
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              key={id}
              className="bg-deep-200 w-full lg:w-[calc((100%-60px)/3)] lg:min-w-[340px] lg:shrink-0 lg:snap-start lg:h-[501px] rounded-[3rem] p-8 flex flex-col justify-between gap-[5rem]"
            >
              <p className="font-primary font-medium text-[2.6rem] leading-[35px] text-white">
                “<br />
                {description}
                <br />”
              </p>
              <div className="text-[2.6rem] leading-[35px] tracking-[-0.78px] flex flex-col gap-[5px]">
                <span className="font-medium text-white">{name}</span>
                <span className="font-normal text-neutral-300">{role}</span>
              </div>
            </motion.li>
          ))}
        </ul>
        {scroll.overflows && (
          <div className="hidden lg:flex items-center gap-8">
            <button
              onClick={() => page(-1)}
              disabled={scroll.atStart}
              aria-label="Previous"
              className={arrowClass}
            >
              <ArrowLeft2 size="35" color="#E45B00" variant="Bulk" />
            </button>
            <button
              onClick={() => page(1)}
              disabled={scroll.atEnd}
              aria-label="Next"
              className={arrowClass}
            >
              <ArrowRight2 size="35" color="#E45B00" variant="Bulk" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
