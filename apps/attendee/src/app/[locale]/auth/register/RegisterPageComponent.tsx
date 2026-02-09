"use client";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import US from "@/assets/flags/us.svg";
import FR from "@/assets/flags/fr.svg";
import Image from "next/image";
import { motion } from "framer-motion";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Input, PasswordInput } from "@/components/shared/Inputs";
import { ButtonPrimary } from "@/components/shared/buttons";

export default function RegisterPageComponent({
  referralCode,
}: {
  referralCode: string | undefined;
}) {
  const [isInvited, setIsInvited] = useState(false);
  const [invitedBy, setInvitedBy] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  useEffect(function () {
    if (referralCode && referralCode !== "") {
      setIsLoading(true);
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/referral/${referralCode}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "success") {
            setIsInvited(true);
            setInvitedBy(data.fullName);
          } else {
            toast.error("Invalid referral code");
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, []);
  const t = useTranslations("Auth.register");
  const RegisterSchema = z
    .object({
      firstName: z.string().min(2, { error: t("errors.firstname_length") }),
      lastName: z.string().min(2, { error: t("errors.lastname_length") }),
      email: z.string().min(1, { error: t("errors.email") }),
      password: z
        .string()
        .min(8, { message: t("errors.password_length") })
        .refine((password) => /[A-Z]/.test(password))
        .refine((password) =>
          /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        ),
      password_confirmation: z.string(),
    })
    .refine((data) => data.password === data.password_confirmation, {
      message: t("errors.password_match"),
      path: ["password_confirmation"],
    });
  type TRegisterSchema = z.infer<typeof RegisterSchema>;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TRegisterSchema>({
    resolver: zodResolver(RegisterSchema),
  });
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  async function submitHandler(data: TRegisterSchema) {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
          Origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        body: JSON.stringify(data),
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      router.push(`/auth/verify-account/${encodeURIComponent(data.email)}`);
    } else {
      toast.error(response.message);
    }
  }
  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
    router.refresh();
  };
  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      className="flex flex-col items-center justify-between gap-20 w-full h-full pb-4 "
    >
      <div className={"flex flex-col gap-16 w-full"}>
        <div className="flex-1 flex lg:justify-center flex-col w-full pt-[4.5rem]">
          <div className="flex flex-col gap-16 items-center">
            <div className="flex flex-col gap-1 items-center">
              <div className="flex flex-col gap-8 items-center">
                <motion.h3
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="font-medium font-primary text-[3.2rem] leading-[3.5rem] text-black"
                >
                  {t("organizer")}
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
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
              >
                {isLoading ? <LoadingCircleSmall /> : null}
              </motion.div>
              {isInvited && (
                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.45 }}
                  className="text-success text-[1.5rem] text-center leading-[2.5rem]"
                >
                  <span className="font-semibold">{invitedBy}</span>
                  {t("referral")}
                </motion.p>
              )}
            </div>
            <div className=" w-full flex flex-col gap-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Select onValueChange={(e) => switchLocale(e)}>
                  <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] px-8 border-none w-full py-12 text-[1.4rem] text-neutral-700 leading-[20px]">
                    {locale === "en" ? (
                      <>
                        <Image
                          src={US}
                          alt={"us flag"}
                          width={30}
                          height={30}
                        />
                        <span
                          className={
                            "text-[1.4rem] leading-[20px] font-medium text-deep-100"
                          }
                        >
                          English
                        </span>
                      </>
                    ) : (
                      <>
                        <Image
                          src={FR}
                          alt={"french flag"}
                          width={30}
                          height={30}
                        />
                        <span
                          className={
                            "text-[1.4rem] leading-[20px] font-medium text-deep-100"
                          }
                        >
                          Francais
                        </span>
                      </>
                    )}
                  </SelectTrigger>
                  <SelectContent className={"bg-neutral-100"}>
                    <SelectItem
                      className={`flex items-center gap-4`}
                      value="fr"
                    >
                      <Image
                        src={FR}
                        alt={"french flag"}
                        width={30}
                        height={30}
                      />
                      <span>Français</span>
                    </SelectItem>
                    <SelectItem
                      className={`flex items-center gap-4`}
                      value="en"
                    >
                      <Image src={US} alt={"us flag"} width={30} height={30} />
                      <span>English</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className={"flex gap-[1.5rem]"}
              >
                <Input
                  {...register("firstName")}
                  type="text"
                  error={errors.firstName?.message}
                >
                  {t("placeholders.firstname")}
                </Input>
                <Input
                  {...register("lastName")}
                  type="text"
                  error={errors.lastName?.message}
                >
                  {t("placeholders.lastname")}
                </Input>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <Input
                  {...register("email")}
                  type="email"
                  error={errors.email?.message}
                >
                  {t("placeholders.email")}
                </Input>
              </motion.div>
              {/* </div> */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <PasswordInput t={t} validate={true} {...register("password")}>
                  {t("placeholders.password")}
                </PasswordInput>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
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
              transition={{ duration: 0.5, delay: 1 }}
              className="w-full hidden lg:block"
            >
              <ButtonPrimary
                disabled={isSubmitting}
                type={"submit"}
                className={
                  "w-full disabled:opacity-50 disabled:cursor-not-allowed "
                }
              >
                {isSubmitting ? <LoadingCircleSmall /> : t("cta.submit")}
              </ButtonPrimary>
            </motion.div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <ButtonPrimary
            type="submit"
            disabled={isSubmitting}
            className="w-full lg:hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <LoadingCircleSmall /> : t("cta.submit")}
          </ButtonPrimary>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          className={
            "flex items-center justify-between gap-[1.8rem] border border-neutral-100  p-2 lg:p-4 rounded-[10rem] mb-8"
          }
        >
          <span
            className={
              "font-normal text-[1.8rem] leading-[25px] text-center text-neutral-700"
            }
          >
            {t("choice.footer.text")}
          </span>
          <Link
            href={`/auth/login`}
            className={
              "border-2 border-primary-500 px-[2rem] lg:px-[3rem] py-6 rounded-[10rem] font-normal text-primary-500 text-[1.5rem] leading-[20px] bg-primary-100"
            }
          >
            {t("choice.footer.cta")}
          </Link>
        </motion.div>
      </div>
    </form>
  );
}
