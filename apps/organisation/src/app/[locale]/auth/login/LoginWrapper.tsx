"use client";
import { ButtonPrimary } from "@/components/shared/buttons";
import { LinkAccent } from "@/components/shared/Links";
import { Link, useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Input, PasswordInput } from "@/components/shared/Inputs";
import { motion } from "motion/react";

export default function LoginWrapper() {
  const t = useTranslations("Auth.login");
  const LoginSchema = z.object({
    email: z.email(t("errors.email")),
    password: z.string().min(1, t("errors.password")),
  });
  type TLoginSchema = z.infer<typeof LoginSchema>;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TLoginSchema>({
    resolver: zodResolver(LoginSchema),
  });
  const [isLoading, setIsloading] = useState(false);
  const router = useRouter();
  const locale = useLocale();
  async function submitHandler(data: TLoginSchema) {
    setIsloading(true);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
      callbackUrl: process.env.NEXT_PUBLIC_ORGANISATION_URL,
    });
    if (result?.error) {
      toast.error(t("errors.wrong"));
    } else {
      router.push("/auth/onboarding");
    }
    setIsloading(false);
  }
  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      className="flex flex-col items-center h-full pb-4 gap-8"
    >
      <div className="flex-1 flex lg:justify-center flex-col w-full pt-18">
        <div className="flex flex-col gap-16 items-center">
          <div className="flex flex-col gap-8 items-center">
            <motion.h3
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="font-medium font-primary text-center text-[3.2rem] leading-14 text-black"
            >
              {t("title")}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-[1.8rem] text-center leading-10 text-neutral-700"
            >
              {t("description")}
            </motion.p>
          </div>
          <div className=" w-full flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Input
                error={errors.email?.message}
                type="email"
                {...register("email")}
              >
                {t("placeholders.email")}
              </Input>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <PasswordInput
                error={errors.password?.message}
                {...register("password")}
              >
                {t("placeholders.password")}
              </PasswordInput>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex items-center justify-between"
            >
              <span></span>
              <Link
                className="text-[1.5rem] leading-8 text-primary-500"
                href={"/auth/forgot-password"}
              >
                {t("forgot")}
              </Link>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="w-full hidden lg:block"
          >
            <ButtonPrimary
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <LoadingCircleSmall /> : t("cta.submit")}
            </ButtonPrimary>
          </motion.div>
        </div>
      </div>
      <div className="flex flex-col gap-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <ButtonPrimary
            type="submit"
            disabled={isLoading}
            className="w-full lg:hidden"
          >
            {isLoading ? <LoadingCircleSmall /> : t("cta.submit")}
          </ButtonPrimary>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="border border-neutral-100 w-full lg:w-auto p-4 pl-6 flex items-center justify-between gap-4 lg:gap-[1.8rem] rounded-[100px]"
        >
          <span className="text-[1.8rem] leading-10 text-neutral-700">
            {t("footer.text")}
          </span>
          <LinkAccent
            href={`${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/auth/register`}
          >
            {t("footer.cta")}
          </LinkAccent>
        </motion.div>
      </div>
    </form>
  );
}
