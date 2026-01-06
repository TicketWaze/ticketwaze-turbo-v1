"use client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/navigation";
import { TabsContent } from "@radix-ui/react-tabs";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

export default function TermsSections() {
  const t = useTranslations("LegalPage.terms");
  return (
    <section className="bg-white py-[3rem] lg:py-[7.5rem] px-[1.5rem] lg:px-[10rem] rounded-[3rem] flex flex-col items-center lg:items-start gap-[3.5rem] lg:gap-[100px]">
      <Tabs
        defaultValue="terms"
        className="flex flex-col gap-[50px] w-full h-full overflow-hidden"
      >
        <TabsList>
          <TabsTrigger value="terms">{t("terms.title")}</TabsTrigger>
          <TabsTrigger value="privacy">{t("privacy.title")}</TabsTrigger>
        </TabsList>
        <TabsContent
          value="terms"
          className="flex flex-col gap-20 text-[1.5rem] lg:text-[2.2rem] leading-8 lg:leading-12 text-deep-100"
        >
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {t("terms.description")}
          </motion.p>
          {Array.from({ length: 15 }).map((_, index) => {
            return (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                key={t(`terms.${index + 1}.title`)}
              >
                <h3 className="font-bold mb-4">
                  {index + 1}. {t(`terms.${index + 1}.title`)}
                </h3>
                <p className="">
                  {t(`terms.${index + 1}.description`)}{" "}
                  {index === 14 && (
                    <Link
                      href={"mailto:hello@ticketwaze.com"}
                      className="font-bold text-primary-500"
                    >
                      hello@ticketwaze.com
                    </Link>
                  )}
                </p>
              </motion.div>
            );
          })}
        </TabsContent>
        <TabsContent
          value="privacy"
          className="flex flex-col gap-20 text-[1.5rem] lg:text-[2.2rem] leading-8 lg:leading-12 text-deep-100"
        >
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {t("privacy.description")}
          </motion.p>
          {Array.from({ length: 12 }).map((_, index) => {
            return (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                key={t(`privacy.${index + 1}.title`)}
              >
                <h3 className="font-bold mb-4">
                  {index + 1}. {t(`privacy.${index + 1}.title`)}
                </h3>
                <p className="">
                  {t(`privacy.${index + 1}.description`)}{" "}
                  {(index === 4 || index === 11) && (
                    <Link
                      href={"mailto:hello@ticketwaze.com"}
                      className="font-bold text-primary-500"
                    >
                      hello@ticketwaze.com
                    </Link>
                  )}
                </p>
              </motion.div>
            );
          })}
        </TabsContent>
      </Tabs>
    </section>
  );
}
