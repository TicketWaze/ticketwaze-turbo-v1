"use client";
import Image from "next/image";
import WaitlistImg from "@/assets/images/waitlist-image.svg";
import WaitlistImgSm from "@/assets/images/waitlist-image-sm.svg";
import HeroBg from "@/assets/images/hero-bg.svg";
import Navbar from "@/components/Navbar";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod/v4";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import LoadingCircleSmall from "@/components/LoadingCircleSmall";
import { useRouter } from "@/i18n/navigation";

function Hero() {
  const t = useTranslations("WaitlistPage.hero");
  const WaitlistSchema = z.object({
    email: z.email({ error: t("errors.email") }),
    entity: z.enum(["personal", "business"], { error: t("errors.entity") }),
  });
  type TWaitlistSchema = z.infer<typeof WaitlistSchema>;
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<TWaitlistSchema>({
    resolver: zodResolver(WaitlistSchema),
  });
  const locale = useLocale();
  const router = useRouter();
  async function submitHandler(data: TWaitlistSchema) {
    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/waitlist`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            origin: process.env.NEXT_PUBLIC_WEBSITE_URL!,
            "Accept-Language": locale,
          },
          body: JSON.stringify(data),
        }
      );
      const response = await request.json();
      if (response.status === "success") {
        toast.success(t("errors.success"));
        resetField("email");
        resetField("entity");
        router.push("/");
      } else {
        toast.error(t("errors.failed"));
        resetField("email");
        resetField("entity");
      }
    } catch (error) {
      toast.error(t("errors.failed"));
    }
  }
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
        <motion.form
          onSubmit={handleSubmit(submitHandler)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col gap-8 w-full items-center z-50 justify-center"
        >
          <div className="flex flex-col lg:flex-row gap-8 w-full">
            <div className="w-full">
              <input
                disabled={isSubmitting}
                {...register("email")}
                placeholder={t("email")}
                type="email"
                className="p-8 bg-neutral-100 rounded-[5rem] text-[1.5rem] leading-8 placeholder:text-neutral-600 text-black focus:outline-none w-full max-w-[493px]"
              />
              {errors.email && (
                <span className="text-failure text-[1.2rem] pl-8 font-primary leading-8">
                  {errors.email?.message}
                </span>
              )}
            </div>
            <div className="w-full">
              <Select
                disabled={isSubmitting}
                onValueChange={(e) =>
                  setValue("entity", e as "personal" | "business")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("who")} />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="personal">{t("attendee")}</SelectItem>
                  <SelectItem value="business">{t("organizer")}</SelectItem>
                </SelectContent>
              </Select>
              {errors.entity && (
                <span className="text-failure text-[1.2rem] pl-8 font-primary leading-8">
                  {errors.entity?.message}
                </span>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-12 py-5 w-full cursor-pointer rounded-[10rem] bg-primary-500 text-white text-[1.5rem] font-medium leading-8 disabled:cursor-not-allowed flex items-center justify-center disabled:bg-primary-500/50"
          >
            {isSubmitting ? <LoadingCircleSmall /> : t("join")}
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
        </motion.form>
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
