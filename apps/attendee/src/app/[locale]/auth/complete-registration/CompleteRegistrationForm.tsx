"use client";
import { useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { signIn } from "next-auth/react";
import countries from "@/lib/Countries";
import { motion } from "framer-motion";
import { deleteReferralCookie } from "@/actions/referral";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { ButtonPrimary } from "@/components/shared/buttons";

export default function CompleteRegistrationForm({
  accessToken,
  email,
  password,
  referralCode,
}: {
  accessToken: string;
  email: string;
  password: string;
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
  const t = useTranslations("Auth.complete");
  const CompleteRegistrationSchema = z.object({
    country: z.string({ error: t("placeholders.errors.country") }),
    city: z.string().min(1, { error: t("placeholders.errors.city") }),
    state: z.string().min(1, { error: t("placeholders.errors.state") }),
    dateOfBirth: z.string().min(1, { error: t("placeholders.errors.dob") }),
    gender: z.string({ error: t("placeholders.errors.gender") }),
  });
  type TCompleteRegistrationSchema = z.infer<typeof CompleteRegistrationSchema>;
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TCompleteRegistrationSchema>({
    resolver: zodResolver(CompleteRegistrationSchema),
    defaultValues: {
      country: "Haiti",
    },
  });
  const locale = useLocale();
  const router = useRouter();
  async function submitHandler(data: TCompleteRegistrationSchema) {
    if (referralCode && referralCode !== "") {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/complete-registration/${accessToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept-Language": locale,
            Origin: process.env.NEXT_PUBLIC_APP_URL!,
          },
          body: JSON.stringify({ ...data, referralCode }),
        },
      );
      const response = await request.json();
      if (response.status === "success") {
        const result = await signIn("credentials", {
          email: email,
          password: password,
          redirect: false,
          callbackUrl: process.env.NEXT_PUBLIC_APP_URL,
        });
        if (result?.error) {
          toast.error("Login failed");
        } else {
          router.push("/auth/onboarding");
        }
      } else {
        toast(response.message);
      }
    } else {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/complete-registration/${accessToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept-Language": locale,
            Origin: process.env.NEXT_PUBLIC_APP_URL ?? "",
          },
          body: JSON.stringify(data),
        },
      );
      const response = await request.json();
      if (response.status === "success") {
        const result = await signIn("credentials", {
          email: email,
          password: password,
          redirect: false,
          callbackUrl: process.env.NEXT_PUBLIC_APP_URL,
        });
        if (result?.error) {
          toast.error("Login failed");
        } else {
          await deleteReferralCookie();
          router.push("/auth/onboarding");
        }
      } else {
        toast(response.message);
      }
    }
  }
  const availableCountries = countries.map((country) => country.name);
  const availableState = countries.map((country) => country.state).flat();
  const [selectedState, setSelectedState] = useState<string>("Sud");
  const cities = availableState.filter((state) => state.name === selectedState);
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
                  className="font-medium text-center font-primary text-[3.2rem] leading-[3.5rem] text-black"
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
                <Select
                  defaultValue="Haiti"
                  onValueChange={(e) => setValue("country", e)}
                >
                  <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] px-8 border-none w-full py-12 text-[1.4rem] text-neutral-700 leading-[20px]">
                    <SelectValue placeholder={t("placeholders.country")} />
                  </SelectTrigger>
                  <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
                    <SelectGroup>
                      {countries &&
                        availableCountries.map((country, i) => {
                          return (
                            <SelectItem
                              className={"text-[1.4rem] text-deep-100"}
                              key={i}
                              value={country}
                            >
                              {country}
                            </SelectItem>
                          );
                        })}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.country && (
                  <span className={"text-[1.2rem] px-8 py-2 text-failure"}>
                    {errors.country.message}
                  </span>
                )}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className={"flex gap-[1.5rem]"}
              >
                <div className="flex-1">
                  <Select
                    onValueChange={(e) => {
                      setValue("state", e);
                      setSelectedState(e);
                    }}
                  >
                    <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] px-8 border-none w-full py-12 text-[1.4rem] text-neutral-700 leading-[20px]">
                      <SelectValue placeholder={t("placeholders.state")} />
                    </SelectTrigger>
                    <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
                      <SelectGroup>
                        {availableState.map((state, i) => {
                          return (
                            <SelectItem
                              className={"text-[1.4rem] text-deep-100"}
                              key={i}
                              value={state.name}
                            >
                              {state.name}
                            </SelectItem>
                          );
                        })}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.state && (
                    <span className={"text-[1.2rem] px-8 py-2 text-failure"}>
                      {errors.state.message}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <Select onValueChange={(e) => setValue("city", e)}>
                    <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] px-8 border-none w-full py-12 text-[1.4rem] text-neutral-700 leading-[20px]">
                      <SelectValue placeholder={t("placeholders.city")} />
                    </SelectTrigger>
                    <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
                      <SelectGroup>
                        {cities[0].cities.map((city, i) => {
                          return (
                            <SelectItem
                              className={"text-[1.4rem] text-deep-100"}
                              key={i}
                              value={city}
                            >
                              {city}
                            </SelectItem>
                          );
                        })}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.city && (
                    <span className={"text-[1.2rem] px-8 py-2 text-failure"}>
                      {errors.city.message}
                    </span>
                  )}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <div
                  className={
                    "bg-neutral-100 w-full rounded-[5rem] py-4 px-8 text-[1.5rem] leading-[20px] placeholder:text-neutral-600 text-deep-200 outline-none border disabled:text-neutral-600 disabled:cursor-not-allowed border-transparent focus:border-primary-500"
                  }
                >
                  <span className={"text-neutral-600 text-[1.2rem]"}>
                    {t("placeholders.dob")}
                  </span>
                  <input
                    type={"date"}
                    className={"w-full outline-none"}
                    {...register("dateOfBirth")}
                  />
                </div>
                {errors.dateOfBirth && (
                  <span className={"text-[1.2rem] px-8 py-2 text-failure"}>
                    {errors.dateOfBirth.message}
                  </span>
                )}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <Select onValueChange={(e) => setValue("gender", e)}>
                  <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] px-8 border-none w-full py-12 text-[1.4rem] text-neutral-700 leading-[20px]">
                    <SelectValue placeholder={t("placeholders.gender")} />
                  </SelectTrigger>
                  <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
                    <SelectGroup>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value={"male"}
                      >
                        {t("placeholders.male")}
                      </SelectItem>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value={"female"}
                      >
                        {t("placeholders.female")}
                      </SelectItem>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value={"others"}
                      >
                        {t("placeholders.no")}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <span className={"text-[1.2rem] px-8 py-2 text-failure"}>
                    {errors.gender.message}
                  </span>
                )}
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="w-full hidden lg:block"
            >
              <ButtonPrimary
                disabled={isSubmitting}
                type={"submit"}
                className={
                  "w-full disabled:opacity-50 disabled:cursor-not-allowed "
                }
              >
                {isSubmitting ? <LoadingCircleSmall /> : t("cta")}
              </ButtonPrimary>
            </motion.div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <ButtonPrimary
            disabled={isSubmitting}
            type={"submit"}
            className={
              "w-full lg:hidden disabled:opacity-50 disabled:cursor-not-allowed "
            }
          >
            {isSubmitting ? <LoadingCircleSmall /> : t("cta")}
          </ButtonPrimary>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
          className={
            "flex items-center self-center  gap-[1.8rem] border border-neutral-100 p-6 rounded-[10rem] mb-8"
          }
        >
          <p
            className={
              "text-[2.2rem] font-normal leading-[3rem] text-center text-neutral-700"
            }
          >
            <span className={"text-primary-500"}>2</span>/2
          </p>
        </motion.div>
      </div>
    </form>
  );
}
