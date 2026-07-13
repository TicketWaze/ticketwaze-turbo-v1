"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft2, ArrowRight2, LoginCurve, UserOctagon } from "iconsax-reactjs";
import { Link, useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { Input, PasswordInput } from "@/components/shared/Inputs";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { LinkAccent } from "@/components/shared/Links";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import GoogleSignInButton from "@/components/shared/GoogleSignInButton";

type View = "choice" | "login";

function TermsNote() {
  const t = useTranslations("Auth.register.terms");
  return (
    <p className="text-[1.3rem] leading-6 text-neutral-500 text-center">
      {t("before")}
      <a
        href="https://ticketwaze.com/legals"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-500 hover:underline"
      >
        {t("terms")}
      </a>
      {t("and")}
      <a
        href="https://ticketwaze.com/legals"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-500 hover:underline"
      >
        {t("privacy")}
      </a>
    </p>
  );
}

export default function BuyTicketAuthDialog({
  checkoutUrl,
  isPrivate = false,
}: {
  checkoutUrl: string;
  isPrivate?: boolean;
}) {
  const [view, setView] = useState<View>("choice");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("Event.buyDialog");
  const tAuth = useTranslations("Auth.login");
  const { update } = useSession();

  const LoginSchema = z.object({
    email: z.email(tAuth("errors.email")),
    password: z.string(),
  });
  type TLoginSchema = z.infer<typeof LoginSchema>;

  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors },
  } = useForm<TLoginSchema>({ resolver: zodResolver(LoginSchema) });

  async function submitHandler(data: TLoginSchema) {
    setIsLoading(true);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    if (result?.error) {
      toast.error("Login failed");
    } else {
      const session = await update();
      if (!session?.user.userPreference) {
        router.push("/auth/onboarding");
      } else {
        router.push(checkoutUrl, {
          locale: session.user.userPreference.appLanguage,
        });
      }
    }
    resetField("password");
    setIsLoading(false);
  }

  return (
    <DialogContent className="w-xl lg:w-208 max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="sr-only">
          {view === "choice" ? t("title") : tAuth("title")}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {view === "choice" ? t("description") : tAuth("description")}
        </DialogDescription>
      </DialogHeader>

      <AnimatePresence mode="wait" initial={false}>
        {view === "choice" && (
          <motion.div
            key="choice"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="flex flex-col gap-10 py-4"
          >
            <div className="flex flex-col gap-4 items-center text-center">
              <h3 className="font-primary font-medium text-[2.8rem] leading-12 text-black">
                {t("title")}
              </h3>
              <p className="text-[1.6rem] leading-8 text-neutral-700">
                {t("description")}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => setView("login")}
                className="flex items-center justify-between gap-4 p-6 rounded-[15px] border border-neutral-100 hover:border-primary-500 hover:bg-primary-50 transition-all duration-300 text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-[4.4rem] h-[4.4rem] rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <LoginCurve size={20} color="#E45B00" variant="Bulk" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                      {t("login")}
                    </span>
                    <span className="text-[1.3rem] leading-6 text-neutral-600">
                      {t("login_description")}
                    </span>
                  </div>
                </div>
                <ArrowRight2 size={20} color="#737C8A" variant="Bulk" className="shrink-0" />
              </button>

              {/* Guest checkout is not available for private activities — buyers must
                  sign in with the invited account email. */}
              {!isPrivate && (
                <button
                  onClick={() => router.push(checkoutUrl)}
                  className="flex items-center justify-between gap-4 p-6 rounded-[15px] border border-neutral-100 hover:border-primary-500 hover:bg-primary-50 transition-all duration-300 text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-[4.4rem] h-[4.4rem] rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                      <UserOctagon size={20} color="#737C8A" variant="Bulk" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                        {t("guest")}
                      </span>
                      <span className="text-[1.3rem] leading-6 text-neutral-600">
                        {t("guest_description")}
                      </span>
                    </div>
                  </div>
                  <ArrowRight2 size={20} color="#737C8A" variant="Bulk" className="shrink-0" />
                </button>
              )}
            </div>

            {isPrivate && (
              <p className="text-[1.4rem] leading-7 text-neutral-600 text-center">
                {t("private_note")}
              </p>
            )}

            <div className="flex flex-col gap-4">
              <span className="text-neutral-700 text-center text-[1.6rem] leading-8">
                {tAuth("cta.or")}
              </span>
              <GoogleSignInButton callbackUrl={checkoutUrl} />
              <TermsNote />
            </div>

            <div className="border border-neutral-100 w-full p-4 pl-6 flex items-center justify-between gap-4 rounded-[100px]">
              <span className="text-[1.6rem] leading-8 text-neutral-700">
                {tAuth("footer.text")}
              </span>
              <LinkAccent href="/auth/register">{tAuth("footer.cta")}</LinkAccent>
            </div>
          </motion.div>
        )}

        {view === "login" && (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="flex flex-col gap-6 py-4"
          >
            <button
              onClick={() => setView("choice")}
              className="flex items-center gap-3 w-fit text-neutral-600 hover:text-primary-500 transition-colors"
            >
              <ArrowLeft2 size={18} color="#737C8A" variant="Bulk" />
              <span className="text-[1.5rem] leading-8">{t("back")}</span>
            </button>

            <form
              onSubmit={handleSubmit(submitHandler)}
              className="flex flex-col items-center pb-4 gap-4"
            >
              <div className="flex-1 flex lg:justify-center flex-col w-full">
                <div className="flex flex-col gap-16 items-center">
                  <div className="flex flex-col gap-8 items-center">
                    <motion.h3
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      className="font-medium font-primary text-[3.2rem] leading-14 text-black"
                    >
                      {tAuth("title")}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.07 }}
                      className="text-[1.8rem] text-center leading-10 text-neutral-700"
                    >
                      {tAuth("description")}
                    </motion.p>
                  </div>

                  <div className="w-full flex flex-col gap-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.14 }}
                    >
                      <Input
                        error={errors.email?.message}
                        type="email"
                        autoFocus={false}
                        {...register("email")}
                      >
                        {tAuth("placeholders.email")}
                      </Input>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.21 }}
                    >
                      <PasswordInput
                        error={errors.password?.message}
                        {...register("password")}
                      >
                        {tAuth("placeholders.password")}
                      </PasswordInput>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.28 }}
                      className="flex justify-end"
                    >
                      <Link
                        className="text-[1.5rem] leading-8 text-primary-500"
                        href="/auth/forgot-password"
                      >
                        {tAuth("forgot")}
                      </Link>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.35 }}
                    className="w-full flex flex-col gap-6"
                  >
                    <ButtonPrimary type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? <LoadingCircleSmall /> : tAuth("cta.submit")}
                    </ButtonPrimary>
                    <span className="text-neutral-700 text-center text-[1.6rem] leading-8">
                      {tAuth("cta.or")}
                    </span>
                    <GoogleSignInButton callbackUrl={checkoutUrl} />
                    <TermsNote />
                  </motion.div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.42 }}
                className="border border-neutral-100 w-full p-4 pl-6 flex items-center justify-between gap-4 rounded-[100px]"
              >
                <span className="text-[1.8rem] leading-10 text-neutral-700">
                  {tAuth("footer.text")}
                </span>
                <LinkAccent href="/auth/register">{tAuth("footer.cta")}</LinkAccent>
              </motion.div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </DialogContent>
  );
}
