"use client";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/navigation";
import { TabsContent } from "@radix-ui/react-tabs";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";

type Doc = "terms" | "privacy";

const SECTION_COUNT: Record<Doc, number> = { terms: 15, privacy: 12 };
// Sections whose text ends with the contact address.
const MAIL_SECTIONS: Record<Doc, number[]> = { terms: [15], privacy: [5, 12] };
// A section counts as being read once its heading is this far from the top.
const ACTIVE_OFFSET_PX = 200;

/**
 * Terms of use and privacy policy, one tab each.
 *
 * On desktop a table of contents sits beside the text and stays in view while
 * the page scrolls; the section being read is highlighted, and clicking an
 * entry scrolls to it. Below lg the text is shown on its own.
 */
export default function TermsSections() {
  const t = useTranslations("LegalPage.terms");
  const [doc, setDoc] = useState<Doc>("terms");
  const [active, setActive] = useState(1);
  const reduceMotion = useReducedMotion();

  const sections = Array.from({ length: SECTION_COUNT[doc] }, (_, i) => ({
    number: i + 1,
    id: `${doc}-${i + 1}`,
    title: t(`${doc}.${i + 1}.title`),
    description: t(`${doc}.${i + 1}.description`),
  }));

  // Scroll spy: the active section is the last one whose heading has passed
  // ACTIVE_OFFSET_PX from the top of the window.
  useEffect(() => {
    const ids = Array.from(
      { length: SECTION_COUNT[doc] },
      (_, i) => `${doc}-${i + 1}`,
    );
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let current = 1;
        ids.forEach((id, i) => {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= ACTIVE_OFFSET_PX)
            current = i + 1;
        });
        setActive(current);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [doc]);

  const scrollTo = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  };

  const body = (current: Doc) => (
    <TabsContent
      value={current}
      className="flex-1 lg:max-w-[761px] flex flex-col gap-20 text-[1.5rem] lg:text-[2.2rem] leading-8 lg:leading-[30px] text-deep-100"
    >
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {t(`${current}.description`)}
      </motion.p>
      {sections.map(({ number, id, title, description }) => (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          key={id}
          id={id}
          className="scroll-mt-[40px]"
        >
          <h3 className="font-bold mb-8">
            {number}. {title}
          </h3>
          <p>
            {description}{" "}
            {MAIL_SECTIONS[current].includes(number) && (
              <Link
                href={"mailto:hello@ticketwaze.com"}
                className="font-bold text-primary-500"
              >
                hello@ticketwaze.com
              </Link>
            )}
          </p>
        </motion.div>
      ))}
    </TabsContent>
  );

  return (
    <section className="bg-white py-[3rem] lg:py-[10rem] px-[1.5rem] lg:px-[10rem] rounded-[3rem] flex flex-col items-center lg:items-start">
      <Tabs
        value={doc}
        onValueChange={(value) => {
          setDoc(value as Doc);
          setActive(1);
        }}
        // overflow-x-clip rather than hidden: hidden would stop the table of
        // contents from sticking.
        className="flex flex-col gap-[50px] lg:gap-[80px] w-full overflow-x-clip"
      >
        <TabsList>
          <TabsTrigger value="terms">{t("terms.title")}</TabsTrigger>
          <TabsTrigger value="privacy">{t("privacy.title")}</TabsTrigger>
        </TabsList>
        <div className="flex gap-[100px] items-start">
          <nav
            aria-label={t(`${doc}.title`)}
            className="hidden lg:block w-[329px] shrink-0 sticky top-[40px] max-h-[calc(100vh-80px)] overflow-y-auto [scrollbar-width:none]"
          >
            <ol className="flex flex-col gap-[20px]">
              {sections.map(({ number, id, title }) => {
                const isActive = number === active;
                return (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollTo(id);
                      }}
                      aria-current={isActive ? "location" : undefined}
                      className="group flex items-start gap-[5px] text-[2.2rem] leading-[30px]"
                    >
                      <span
                        className={`mt-[14px] h-[2.5px] shrink-0 rounded-[50px] transition-all duration-300 ${
                          isActive
                            ? "w-[75px] bg-black"
                            : "w-[25px] bg-neutral-500 group-hover:bg-black"
                        }`}
                      />
                      <span
                        className={`transition-colors duration-300 ${
                          isActive
                            ? "font-medium text-black"
                            : "font-normal text-neutral-500 group-hover:text-black"
                        }`}
                      >
                        {title}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
          {body("terms")}
          {body("privacy")}
        </div>
      </Tabs>
    </section>
  );
}
