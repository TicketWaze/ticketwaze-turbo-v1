"use client";
import { Link, useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { motion } from "framer-motion";
import Google from "@/assets/icons/google.svg";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Input, PasswordInput } from "@/components/shared/Inputs";
import { ButtonBlack, ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { LinkAccent } from "@/components/shared/Links";

export default function LoginPageContent() {
  const t = useTranslations("Auth.login");
  const LoginSchema = z.object({
    email: z.email(t("errors.email")),
    password: z.string(),
  });
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorMessage = error ? decodeURIComponent(error) : null;
  if (errorMessage) toast.error("AccessDenied");

  type TLoginSchema = z.infer<typeof LoginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TLoginSchema>({
    resolver: zodResolver(LoginSchema),
  });
  const [isLoading, setIsloading] = useState(false);
  const { update } = useSession();
  const router = useRouter();
  async function submitHandler(data: TLoginSchema) {
    setIsloading(true);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
      callbackUrl: process.env.NEXT_PUBLIC_APP_URL,
    });
    if (result?.error) {
      toast.error("Login failed");
    } else {
      const data = await update();
      if (!data?.user.userPreference) {
        router.push("/auth/onboarding");
      } else {
        const locale = data?.user.userPreference.appLanguage;
        window.location.href = `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/explore`;
      }
    }
    setIsloading(false);
  }
  async function googleLogin() {
    setIsloading(true);
    await signIn("google", {
      redirect: true,
      callbackUrl: process.env.NEXT_PUBLIC_APP_URL,
    });
    setIsloading(false);
  }
  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      className="flex flex-col items-center h-full pb-4"
    >
      <div className="flex-1 flex lg:justify-center flex-col w-full pt-[4.5rem]">
        <div className="flex flex-col gap-16 items-center">
          <div className="flex flex-col gap-8 items-center">
            <motion.h3
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="font-medium font-primary text-[3.2rem] leading-[3.5rem] text-black"
            >
              {t("title")}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-[1.8rem] text-center leading-[2.5rem] text-neutral-700"
            >
              {t("description")}
            </motion.p>
          </div>
          <div className=" w-full flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
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
              transition={{ duration: 0.5, delay: 0.6 }}
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
              transition={{ duration: 0.5, delay: 0.7 }}
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
            transition={{ duration: 0.5, delay: 0.8 }}
            className="w-full hidden lg:flex flex-col gap-8
          "
          >
            <ButtonPrimary
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <LoadingCircleSmall /> : t("cta.submit")}
            </ButtonPrimary>
            <span className="text-neutral-700 text-center text-[1.8rem] leading-8">
              {t("cta.or")}
            </span>
            <ButtonBlack
              type="button"
              onClick={googleLogin}
              disabled={isLoading}
              className="flex items-center justify-center gap-4 mb-10"
            >
              {isLoading ? (
                <LoadingCircleSmall />
              ) : (
                <>
                  <Image src={Google} alt="google login" />
                  {t("cta.google")}
                </>
              )}
            </ButtonBlack>
          </motion.div>
        </div>
      </div>
      <div className="flex flex-col gap-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="lg:hidden"
        >
          <ButtonPrimary
            type="submit"
            disabled={isLoading}
            className="w-full lg:hidden"
          >
            {isLoading ? <LoadingCircleSmall /> : t("cta.submit")}
          </ButtonPrimary>
        </motion.div>
        <motion.span
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.85 }}
          className="text-neutral-700 lg:hidden text-center text-[1.8rem] leading-8"
        >
          {t("cta.or")}
        </motion.span>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="lg:hidden"
        >
          <ButtonBlack
            type="button"
            onClick={googleLogin}
            disabled={isLoading}
            className="flex items-center w-full justify-center gap-4"
          >
            {isLoading ? (
              <LoadingCircleSmall />
            ) : (
              <>
                <Image src={Google} alt="google login" />
                {t("cta.google")}
              </>
            )}
          </ButtonBlack>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="border border-neutral-100 w-full lg:w-auto p-4 pl-6 flex items-center justify-between gap-4 lg:gap-[1.8rem] rounded-[100px]"
        >
          <span className="text-[1.8rem] leading-[2.5rem] text-neutral-700">
            {t("footer.text")}
          </span>
          <LinkAccent href="/auth/register">{t("footer.cta")}</LinkAccent>
        </motion.div>
      </div>
    </form>
  );
}
