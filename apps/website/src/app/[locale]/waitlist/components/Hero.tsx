"use client";
import Image from "next/image";
import WaitlistImg from "@/assets/images/waitlist-image.svg";
import WaitlistImgSm from "@/assets/images/waitlist-image-sm.svg";
import HeroBg from "@/assets/images/hero-bg.svg";
import Navbar from "@/components/Navbar";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function Hero() {
  const t = useTranslations("WaitlistPage.hero");
  return (
    <section className="bg-white py-[2.5rem] px-4 rounded-[3rem] flex flex-col gap-[6.5rem] items-center">
      <Navbar />
      <div className="flex flex-col relative gap-8 max-w-[890px]">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-bold text-[3.8rem] lg:text-[7.8rem] font-primary leading-[45px] lg:leading-[90px] text-center"
        >
          <span className="text-neutral-900">{t("title.1")}</span>{" "}
          <span className="text-deep-200">{t("title.2")}</span>,{" "}
          <span className="text-neutral-900">{t("title.3")}</span>{" "}
          <span className="text-deep-200">{t("title.4")}</span>,{" "}
          <span className="text-neutral-900">{t("title.5")}</span>{" "}
          <span className="text-deep-200">{t("title.6")}</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-[1.6rem] lg:text-[2.6rem] leading-[22.5px] lg:leading-[35px] text-neutral-700 font-sans text-center z-50"
        >
          {t("description")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col gap-8 w-full items-center z-50 justify-center"
        >
          <div className="flex flex-col lg:flex-row gap-8 w-full">
            <input
              placeholder={t("email")}
              type="email"
              className="p-8 bg-neutral-100 rounded-[5rem] text-[1.5rem] leading-8 placeholder:text-neutral-600 text-black focus:outline-none w-full max-w-[493px]"
            />
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("who")} />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="attendee">{t("attendee")}</SelectItem>
                <SelectItem value="organisation">{t("organizer")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button className="px-12 py-5 w-full cursor-pointer rounded-[10rem] bg-primary-500 text-white text-[1.5rem] font-medium leading-8">
            {t("join")}
          </button>
          {/* <Link
                  href={"/waitlist"}
                  className="px-[3rem] py-[7.5px] border border-[#E45B00] bg-[#fee7d5] rounded-[100px] flex items-center gap-4"
                >
                  <Timer1 size="20" color="#E45B00" variant="Bulk" />
                  <span className="font-medium font-sans text-[1.5rem] text-primary-500">
                    {t("cta.waitlist")}
                  </span>
                </Link> */}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className={"hidden lg:block z-50"}
        >
          <Image src={WaitlistImg} alt={"Waitlist image"} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className={"lg:hidden z-50"}
        >
          <Image src={WaitlistImgSm} alt={"Waitlist image"} />
        </motion.div>
        <Image className={"absolute bottom-0"} src={HeroBg} alt={"Hero bg"} />
      </div>
      {/* <header className={"flex relative flex-col items-center gap-[60px]"}>
        <div
          className={
            "flex flex-col gap-8 items-center max-w-[340px] lg:max-w-[890px] mx-auto text-center pt-[50px] lg:pt-[80px]"
          }
        >
          <h1
            className={
              "font-medium font-primary text-[3.8rem] lg:text-[7.8rem] leading-[45px] lg:leading-[90px] text-neutral-800"
            }
          >
            {t("title-1")}
            <span className={"text-primary-500 font-bold"}>
              {t("title-2")}{" "}
            </span>
          </h1>
          <p
            className={
              "font-normal text-[1.6rem] lg:text-[2.6rem] leading-[22.5px] lg:leading-[35px] text-neutral-700"
            }
          >
            {t("description")}
          </p>
          <div className={"w-full flex flex-col gap-8"}>
            <div className={"flex flex-col lg:flex-row gap-8"}>inputs</div>
          </div>
        </div>
        <Image
          src={WaitlistImg}
          className={"hidden lg:block z-50"}
          alt={"Waitlist image"}
        />
        <Image
          src={WaitlistImgSm}
          className={"lg:hidden z-50"}
          alt={"Waitlist image"}
        />
        <Image className={"absolute bottom-0"} src={HeroBg} alt={"Hero bg"} />
      </header> */}
    </section>
  );
}

export default Hero;
