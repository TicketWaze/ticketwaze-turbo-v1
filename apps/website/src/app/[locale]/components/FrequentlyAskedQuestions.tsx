"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";

function FrequentlyAskedQuestions() {
  const t = useTranslations("HomePage.faq");
  const questions = [
    {
      question: t("question-1"),
      answer: t("answer-1"),
    },
    {
      question: t("question-2"),
      answer: t("answer-2"),
    },
    {
      question: t("question-3"),
      answer: t("answer-3"),
    },
    {
      question: t("question-4"),
      answer: t("answer-4"),
    },
    {
      question: t("question-5"),
      answer: t("answer-5"),
    },
  ];
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={
        "bg-white py-[40px] lg:py-[100px] px-[1.5rem] flex flex-col gap-[40px] lg:gap-[80px] rounded-[3rem] items-center"
      }
    >
      <h2
        className={
          "font-primary font-bold text-[3.2rem] lg:text-[5.4rem] leading-[35px] lg:leading-[65px] text-neutral-800 max-w-[550px] text-center "
        }
      >
        {t("title-1")}
        <span className={"text-primary-500"}>{t("title-2")}</span>
      </h2>
      <div className={"w-full max-w-[890px]"}>
        <Accordion
          type="single"
          collapsible
          className={"flex flex-col gap-4 lg:gap-8"}
        >
          {questions.map(({ question, answer }) => {
            return (
              <AccordionItem value={question} key={question}>
                <AccordionTrigger className={"cursor-pointer"}>
                  {question}
                </AccordionTrigger>
                <AccordionContent>{answer}</AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </motion.section>
  );
}

export default FrequentlyAskedQuestions;
