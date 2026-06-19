"use client";
import { ButtonPrimary } from "@/components/shared/buttons";
import { LinkAccent } from "@/components/shared/Links";
import { Link } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Input, PasswordInput } from "@/components/shared/Inputs";
import { AnimatePresence, motion } from "motion/react";
import GoogleSignInButton from "@/components/shared/GoogleSignInButton";
import { ArrowLeft2, ArrowRight2, LoginCurve } from "iconsax-reactjs";

type View = "choice" | "credentials" | "google";

export default function LoginWrapper() {
  const t = useTranslations("Auth.login");
  const [view, setView] = useState<View>("choice");
  const locale = useLocale();

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
  const { update } = useSession();

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
      const session = await update();
      const lang = session?.user?.userPreference?.appLanguage ?? "en";
      window.location.href = `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${lang}/auth/onboarding`;
    }
    setIsloading(false);
  }

  const footer = (
    <div className="border border-neutral-100 w-full lg:w-auto p-4 pl-6 flex items-center justify-between gap-4 lg:gap-[1.8rem] rounded-[100px]">
      <span className="text-[1.8rem] leading-10 text-neutral-700">
        {t("footer.text")}
      </span>
      <LinkAccent
        href={`${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/auth/register`}
      >
        {t("footer.cta")}
      </LinkAccent>
    </div>
  );

  const terms = (
    <p className="text-[1.3rem] leading-6 text-neutral-500 text-center">
      {t("terms.before")}
      <a
        href="https://ticketwaze.com/legals"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-500 hover:underline"
      >
        {t("terms.terms")}
      </a>
      {t("terms.and")}
      <a
        href="https://ticketwaze.com/legals"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-500 hover:underline"
      >
        {t("terms.privacy")}
      </a>
    </p>
  );

  const googleIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );

  return (
    <div className="flex flex-col items-center h-full pb-4">
      <AnimatePresence mode="wait" initial={false}>
        {view === "choice" && (
          <motion.div
            key="choice"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="flex flex-col justify-between w-full h-full"
          >
            <div className="flex-1 flex justify-center flex-col w-full">
              <div className="flex flex-col gap-16 items-center">
                <div className="flex flex-col gap-8 items-center text-center">
                  <h3 className="font-medium font-primary text-[3.2rem] leading-14 text-black">
                    {t("title")}
                  </h3>
                  <p className="text-[1.8rem] leading-10 text-neutral-700">
                    {t("description")}
                  </p>
                </div>

                <div className="flex flex-col gap-4 w-full">
                  <button
                    onClick={() => setView("google")}
                    className="flex items-center justify-between gap-4 p-6 rounded-[15px] border border-neutral-100 hover:border-primary-500 hover:bg-primary-50 transition-all duration-300 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-[4.4rem] h-[4.4rem] rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0">
                        {googleIcon}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                          {t("method.google")}
                        </span>
                        <span className="text-[1.3rem] leading-6 text-neutral-600">
                          {t("method.google_desc")}
                        </span>
                      </div>
                    </div>
                    <ArrowRight2
                      size={20}
                      color="#737C8A"
                      variant="Bulk"
                      className="shrink-0"
                    />
                  </button>

                  <button
                    onClick={() => setView("credentials")}
                    className="flex items-center justify-between gap-4 p-6 rounded-[15px] border border-neutral-100 hover:border-primary-500 hover:bg-primary-50 transition-all duration-300 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-[4.4rem] h-[4.4rem] rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                        <LoginCurve size={20} color="#E45B00" variant="Bulk" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                          {t("method.credentials")}
                        </span>
                        <span className="text-[1.3rem] leading-6 text-neutral-600">
                          {t("method.credentials_desc")}
                        </span>
                      </div>
                    </div>
                    <ArrowRight2
                      size={20}
                      color="#737C8A"
                      variant="Bulk"
                      className="shrink-0"
                    />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-6 w-full">{footer}</div>
          </motion.div>
        )}

        {view === "google" && (
          <motion.div
            key="google"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="flex flex-col justify-between w-full h-full"
          >
            <div className="flex-1 flex justify-center flex-col w-full">
              <div className="flex flex-col gap-16 items-center">
                <button
                  onClick={() => setView("choice")}
                  className="flex items-center gap-3 w-fit text-neutral-600 hover:text-primary-500 transition-colors self-start"
                >
                  <ArrowLeft2 size={18} color="#737C8A" variant="Bulk" />
                  <span className="text-[1.5rem] leading-8">
                    {t("method.back")}
                  </span>
                </button>

                <div className="flex flex-col gap-8 items-center text-center">
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="font-medium font-primary text-[3.2rem] leading-14 text-black"
                  >
                    {t("cta.google")}
                  </motion.h3>
                  {/* <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                    className="text-[1.8rem] leading-10 text-neutral-700"
                  >
                    {t("description")}
                  </motion.p> */}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="w-full flex flex-col gap-6"
                >
                  <GoogleSignInButton />
                  {terms}
                </motion.div>
              </div>
            </div>
            <div className="flex flex-col gap-6 w-full">{footer}</div>
          </motion.div>
        )}

        {view === "credentials" && (
          <motion.div
            key="credentials"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="flex flex-col justify-between w-full h-full"
          >
            <form
              onSubmit={handleSubmit(submitHandler)}
              className="flex flex-col items-center h-full pb-4 gap-8"
            >
              <div className="flex-1 flex lg:justify-center flex-col w-full pt-18">
                <div className="flex flex-col gap-16 items-center">
                  <button
                    type="button"
                    onClick={() => setView("choice")}
                    className="flex items-center gap-3 w-fit text-neutral-600 hover:text-primary-500 transition-colors self-start"
                  >
                    <ArrowLeft2 size={18} color="#737C8A" variant="Bulk" />
                    <span className="text-[1.5rem] leading-8">
                      {t("method.back")}
                    </span>
                  </button>

                  <div className="flex flex-col gap-8 items-center">
                    <motion.h3
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="font-medium font-primary text-center text-[3.2rem] leading-14 text-black"
                    >
                      {t("title")}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.15 }}
                      className="text-[1.8rem] text-center leading-10 text-neutral-700"
                    >
                      {t("description")}
                    </motion.p>
                  </div>

                  <div className="w-full flex flex-col gap-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
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
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.25 }}
                    >
                      <PasswordInput
                        error={errors.password?.message}
                        {...register("password")}
                      >
                        {t("placeholders.password")}
                      </PasswordInput>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.28 }}
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    {terms}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.33 }}
                    className="w-full"
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.38 }}
                >
                  {footer}
                </motion.div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
