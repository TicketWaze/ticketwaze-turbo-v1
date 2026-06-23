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
import { useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

// Cloudflare's official always-pass test key — replace with your real site key via NEXT_PUBLIC_TURNSTILE_SITE_KEY
const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA";

function Hero() {
  const t = useTranslations("WaitlistPage.hero");
  const WaitlistSchema = z.object({
    email: z.email({ error: t("errors.email") }),
    entity: z.enum(["attendee", "business", "both"], { error: t("errors.entity") }),
  });
  type TWaitlistSchema = z.infer<typeof WaitlistSchema>;
  const {
    register,
    handleSubmit,
    setValue,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<TWaitlistSchema>({
    resolver: zodResolver(WaitlistSchema),
  });
  const locale = useLocale();
  const router = useRouter();

  // Honeypot ref — filled by bots, always empty for real users
  const honeypotRef = useRef<HTMLInputElement>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function submitHandler(data: TWaitlistSchema) {
    // First-line defence: bots fill hidden fields, humans never do
    if (honeypotRef.current?.value) return;

    // Turnstile must have resolved before we proceed
    if (!turnstileToken) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

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
          body: JSON.stringify({ ...data, turnstileToken }),
          signal: controller.signal,
        },
      );
      clearTimeout(timeout);
      const response = await request.json();
      if (response.status === "success") {
        toast.success(t("errors.success"));
        resetField("email");
        resetField("entity");
        router.push("/");
      } else {
        toast.error(response.message);
        resetField("email");
        resetField("entity");
      }
    } catch {
      toast.error(t("errors.failed"));
    } finally {
      // Always reset so the user can submit again without a page reload
      setTurnstileToken(null);
      turnstileRef.current?.reset();
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
          {/* Honeypot — visually hidden, real users never touch it */}
          <input
            ref={honeypotRef}
            name="_website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{
              position: "absolute",
              opacity: 0,
              height: 0,
              width: 0,
              pointerEvents: "none",
            }}
          />

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
                  setValue("entity", e as "attendee" | "business" | "both")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("who")} />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="attendee">{t("attendee")}</SelectItem>
                  <SelectItem value="business">{t("organizer")}</SelectItem>
                  <SelectItem value="both">{t("both")}</SelectItem>
                </SelectContent>
              </Select>
              {errors.entity && (
                <span className="text-failure text-[1.2rem] pl-8 font-primary leading-8">
                  {errors.entity?.message}
                </span>
              )}
            </div>
          </div>

          <Turnstile
            ref={turnstileRef}
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
            onError={() => setTurnstileToken(null)}
            options={{ theme: "light", size: "normal" }}
          />

          <button
            type="submit"
            disabled={isSubmitting || !turnstileToken}
            className="px-12 py-5 w-full cursor-pointer rounded-[10rem] bg-primary-500 text-white text-[1.5rem] font-medium leading-8 disabled:cursor-not-allowed flex items-center justify-center disabled:bg-primary-500/50"
          >
            {isSubmitting ? <LoadingCircleSmall /> : t("join")}
          </button>
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
    </section>
  );
}

export default Hero;
