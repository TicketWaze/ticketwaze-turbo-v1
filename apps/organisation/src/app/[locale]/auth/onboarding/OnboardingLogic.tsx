"use client";
import PageLoader from "@/components/PageLoader";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Organisation, User } from "@ticketwaze/typescript-config";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function OnboardingLogic({
  responseType,
  user,
  organisations,
}: {
  responseType: "invite" | "login" | "create";
  user: User;
  organisations: Organisation[];
}) {
  const t = useTranslations("Auth.onboarding");
  const [invitedOrganisations, setInvitedOrganisation] = useState<
    Organisation[] | undefined
  >();
  const [createOrganisation, setCreateOrganisation] = useState(false);
  const { data: session, update } = useSession();
  const locale = useLocale();
  const [isLoading, setIsloading] = useState(false);
  useEffect(() => {
    const handleOnboarding = async () => {
      if (responseType === "invite") {
        setInvitedOrganisation(organisations);
      } else if (responseType === "create") {
        setCreateOrganisation(true);
      } else {
        if (user?.organisations[0]?.organisationId) {
          try {
            await update({
              activeOrganisation: user.organisations[0],
            });
            window.location.href = `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${user.userPreference.appLanguage}/analytics`;
          } catch (error) {
            toast.error("Failed to load organisation");
          }
        } else {
          toast.error("No organisation found");
        }
      }
    };
    handleOnboarding();
  }, []);

  async function JoinOrganisation(organisation: Organisation) {
    setIsloading(true);
    try {
      const req = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/invite/${organisation.organisationId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user.accessToken}`,
            "Accept-Language": locale,
            Origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
          },
        },
      );
      const res = await req.json();
      if (res.status === "success") {
        await update({
          activeOrganisation: organisation,
        });
        window.location.href = `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${user.userPreference.appLanguage}/analytics`;
      }
    } catch (error) {
      console.error("Failed to join organisation:", error);
      toast.error("Failed to Join Organisation");
    }
    setIsloading(false);
  }
  async function CreateOrganisation() {
    setIsloading(true);
    try {
      const req = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/onboarding/createOrganisation`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user.accessToken}`,
            "Accept-Language": locale,
            Origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
          },
        },
      );
      const res = await req.json();
      if (res.status === "success") {
        await update({
          activeOrganisation: res.user.organisations[0],
        });
        window.location.href = `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${res.user.userPreference.appLanguage}/analytics`;
      } else {
        toast.error("Failed to Creare Organisation");
      }
    } catch (error) {
      toast.error("Failed to Creare Organisation : " + error);
    }
    setIsloading(false);
  }

  return (
    <div
      className={`h-full flex flex-col items-center ${!invitedOrganisations && !createOrganisation && "justify-center"} w-full `}
    >
      <PageLoader isLoading={isLoading} />
      {invitedOrganisations && (
        <div className=" flex flex-col gap-32 pt-16 w-full">
          <div className="flex flex-col gap-8 items-center">
            <h3 className="font-medium font-primary text-[3.2rem] leading-14 text-black">
              {t("title")}
            </h3>
            <p className="text-[1.8rem] text-center leading-10 text-neutral-700">
              {t("description")}
            </p>
          </div>
          {invitedOrganisations.map((organisation) => {
            return (
              <div
                key={organisation.organisationId}
                className="flex items-center justify-between gap-3 bg-neutral-100 px-6 py-8 rounded-[15px] w-full"
              >
                <div className="flex items-center gap-4">
                  {organisation?.profileImageUrl ? (
                    <Image
                      src={organisation.profileImageUrl}
                      width={35}
                      height={35}
                      alt={organisation.organisationName}
                      className="rounded-full"
                    />
                  ) : (
                    <span className="w-14 h-14 flex items-center justify-center bg-black rounded-full text-white uppercase font-medium text-[2.2rem] leading-12 font-primary">
                      {organisation?.organisationName.slice()[0]?.toUpperCase()}
                    </span>
                  )}
                  <span className="text-[1.6rem]">
                    {organisation.organisationName}
                  </span>
                </div>
                <ButtonPrimary
                  disabled={isLoading}
                  onClick={() => JoinOrganisation(organisation)}
                >
                  {isLoading ? <LoadingCircleSmall /> : t("join")}
                </ButtonPrimary>
              </div>
            );
          })}
        </div>
      )}
      {createOrganisation && (
        <div className="flex flex-col items-center justify-between h-full pb-12">
          <div className=" flex flex-col  gap-32 pt-16 w-full">
            <div className="flex flex-col gap-8 items-center">
              <motion.h3
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="font-medium font-primary text-center text-[3.2rem] leading-14 text-black"
              >
                {t("title2")}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-[1.8rem] text-center leading-10 text-neutral-700"
              >
                {t("description2")}
              </motion.p>
            </div>
            <div className="flex items-center flex-col gap-20 lg:gap-12">
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="font-primary text-center font-medium text-[1.8rem] leading-10 text-neutral-900"
              >
                {t("alert")}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="w-full"
              >
                <ButtonPrimary
                  disabled={isLoading}
                  onClick={CreateOrganisation}
                  className="w-full hidden lg:flex"
                >
                  {isLoading ? <LoadingCircleSmall /> : t("action")}
                </ButtonPrimary>
              </motion.div>
            </div>
          </div>
          <ButtonPrimary
            onClick={CreateOrganisation}
            className="w-full lg:hidden"
            disabled={isLoading}
          >
            {isLoading ? <LoadingCircleSmall /> : t("action")}
          </ButtonPrimary>
        </div>
      )}

      {!createOrganisation && !invitedOrganisations && <LoadingCircleSmall />}
    </div>
  );
}
