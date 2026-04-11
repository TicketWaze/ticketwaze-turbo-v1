"use client";
import { useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { PasswordInput } from "@/components/shared/Inputs";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { LinkAccent } from "@/components/shared/Links";

export default function JoinPageContent() {
  const t = useTranslations("Auth.join");
  const JoinSchema = z
    .object({
      password: z
        .string()
        .min(8, { message: t("errors.password_length") })
        .refine((password) => /[A-Z]/.test(password))
        .refine((password) =>
          /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        )
        .refine((password) => /[0-9]/.test(password)),
      password_confirmation: z.string(),
    })
    .refine((data) => data.password === data.password_confirmation, {
      message: t("errors.password_match"),
      path: ["password_confirmation"],
    });
  type TJoinSchema = z.infer<typeof JoinSchema>;
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorMessage = error ? decodeURIComponent(error) : null;
  if (errorMessage) toast.error("AccesDenied"); //en fr file toast error

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TJoinSchema>({
    resolver: zodResolver(JoinSchema),
  });
  const [isLoading, setIsloading] = useState(false);
  const { update } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const password = watch("password");

  async function submitHandler(data: TJoinSchema) {
    toast.success("success");
    window.location.href = `${process.env.NEXT_PUBLIC_ADMIN_URL}/${locale}/auth/join/accepted`;
  }
  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      className="flex flex-col items-center justify-between gap-8 h-full pb-4 overflow-y-auto"
    >
      <div className="flex-1 flex lg:justify-center flex-col w-full pt-18">
        <div className="flex flex-col gap-16 items-center">
          <div className="flex flex-col gap-8 items-center">
            <motion.h3
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="font-medium font-primary text-[3.2rem] leading-14 text-black"
            >
              {t("title")}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-[1.8rem] text-center leading-10 text-neutral-700"
            >
              {t("description.hello")} {""}
              <span className="font-bold text-deep-100">
                Ez**@ticketwaze.com
              </span>
              {t("description.main")}
            </motion.p>
          </div>
          <div className=" w-full flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <PasswordInput
                // error={errors.password?.message}
                validate={true}
                t={t}
                {...register("password")}
              >
                {t("placeholders.password")}
              </PasswordInput>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
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
            href={`${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/auth/login`}
          >
            {t("footer.cta")}
          </LinkAccent>
        </motion.div>
      </div>
    </form>
  );
}
