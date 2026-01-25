"use client";
import { ButtonPrimary } from "@/components/shared/buttons";
import { PasswordInput } from "@/components/shared/Inputs";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { motion } from "motion/react";
import { LinkAccent } from "@/components/shared/Links";

export default function NewPasswordPageWrapper({
  accessToken,
}: {
  accessToken: string;
}) {
  const t = useTranslations("Auth.new_password");
  const NewPasswordSchema = z
    .object({
      password: z.string().min(8, t("errors.password_length")),
      password_confirmation: z.string().min(8, t("errors.password_length")),
    })
    .refine((data) => data.password === data.password_confirmation, {
      message: t("errors.password_match"),
      path: ["password_confirmation"],
    });
  type TNewPasswordSchema = z.infer<typeof NewPasswordSchema>;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TNewPasswordSchema>({
    resolver: zodResolver(NewPasswordSchema),
  });
  const locale = useLocale();
  const router = useRouter();
  async function submitHandler(data: TNewPasswordSchema) {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/new-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
          Origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      router.push("/auth/login");
    } else {
      toast.error(response.message);
    }
  }
  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      className="flex flex-col items-center h-full pb-4"
    >
      <div className="flex-1 flex lg:justify-center flex-col w-full pt-18">
        <div className="flex flex-col gap-16 items-center">
          <div className="flex flex-col gap-8 items-center">
            <motion.h3
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="font-medium font-primary text-[3.2rem] leading-14 text-black"
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
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <PasswordInput
                error={errors.password_confirmation?.message}
                {...register("password_confirmation")}
              >
                {t("placeholders.confirm")}
              </PasswordInput>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="w-full hidden lg:block"
          >
            <ButtonPrimary
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? <LoadingCircleSmall /> : t("cta")}
            </ButtonPrimary>
          </motion.div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="w-full"
        >
          <ButtonPrimary
            type="submit"
            disabled={isSubmitting}
            className="w-full lg:hidden"
          >
            {isSubmitting ? <LoadingCircleSmall /> : t("cta")}
          </ButtonPrimary>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className={
            "flex items-center w-fit gap-[1.8rem] border border-neutral-100 p-6 rounded-[10rem] mb-8"
          }
        >
          <p
            className={
              "text-[2.2rem] font-normal leading-12 text-center text-neutral-700"
            }
          >
            <span className={"text-primary-500"}>2</span>/2
          </p>
          <LinkAccent href="/auth/forgot-password">{t("back")}</LinkAccent>
        </motion.div>
      </div>
    </form>
  );
}
