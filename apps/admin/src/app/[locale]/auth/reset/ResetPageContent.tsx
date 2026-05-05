"use client";
import { useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { motion } from "framer-motion";
import { Input } from "@/components/shared/Inputs";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { LinkAccent } from "@/components/shared/Links";

export default function ResetPageContent() {
  const t = useTranslations("Auth.reset");
  const ResetSchema = z.object({
    email: z.string().min(1, { error: t("errors.email") }),
  });
  type TResetSchema = z.infer<typeof ResetSchema>;

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<TResetSchema>({
    resolver: zodResolver(ResetSchema),
  });
  const router = useRouter();
  const locale = useLocale();

  async function submitHandler(data: TResetSchema) {
   const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
          Origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
        body: JSON.stringify(data),
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      router.push(`/auth/reset/${encodeURIComponent(data.email)}`);
    } else {
      toast.error(t("errors.notFound"));
    }
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
              {t("description")}
            </motion.p>
          </div>
          <div className=" w-full flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Input
                error={errors.email?.message}
                type="email"
                {...register("email")}
              >
                {t("placeholders.email")}
              </Input>
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
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? <LoadingCircleSmall /> : t("cta.submit")}
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
            disabled={isSubmitting}
            className="w-full lg:hidden"
          >
            {isSubmitting ? <LoadingCircleSmall /> : t("cta.submit")}
          </ButtonPrimary>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className={
            "flex items-center self-center justify-center w-auto  gap-[1.8rem] border border-neutral-100 p-6 rounded-[10rem] mb-8"
          }
        >
          <p
            className={
              "text-[2.2rem] font-normal leading-12 text-center text-neutral-700"
            }
          >
            <span className={"text-primary-500"}>1</span>/2
          </p>
          <LinkAccent href="/auth/login">
            {t("back")}
          </LinkAccent>
        </motion.div>
      </div>
    </form>
  );
}
