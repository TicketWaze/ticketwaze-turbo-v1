/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import PageLoader from "@/components/PageLoader";
import { ButtonPrimary, ButtonSecondary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Organisation } from "@ticketwaze/typescript-config";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { LinkPrimary, LinkSecondary } from "@/components/shared/Links";
import { useRouter } from "@/i18n/navigation";

export default function OnboardingLogic({ response }: { response: any }) {
  const t = useTranslations("Auth.onboarding");
  const [invitedOrganisations, setInvitedOrganisation] = useState<
    Organisation[] | undefined
  >();
  const [createOrganisation, setCreateOrganisation] = useState(false);
  const { data: session, update } = useSession();
  const locale = useLocale();
  const [isLoading, setIsloading] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const handleOnboarding = async () => {
      if (response.type === "invite") {
        setInvitedOrganisation(response.organisations);
      } else if (response.type === "create") {
        setCreateOrganisation(true);
      } else {
        if (response.user?.organisations[0].organisationId) {
          try {
            await update({
              activeOrganisation: {
                ...response.user.organisations[0],
                membershipTier: response.membershipTier,
              },
            });
            window.location.href = `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/analytics`;
          } catch {
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
        window.location.href = `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/analytics`;
      }
    } catch (error) {
      toast.error(`Failed to Join Organisation : ${(error as Error).message}`);
    }
    setIsloading(false);
  }

  async function cancelInviation(organisation: Organisation) {
    setIsloading(true);
    const req = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/invite/${organisation.organisationId}`,
      {
        method: "DELETE",
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
      router.push(`${process.env.NEXT_PUBLIC_ATTENDEE_URL}/`);
    } else {
      toast.error(res.message);
    }
    setIsloading(false);
  }

  return (
    <div
      className={`h-full flex flex-col items-center ${!invitedOrganisations && !createOrganisation && "justify-center"} w-full `}
    >
      <PageLoader isLoading={isLoading} />
      {invitedOrganisations && (
        <div className=" flex flex-col gap-12 pt-16 w-full">
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
          <ul className="flex flex-col gap-10 w-full">
            {invitedOrganisations.map((organisation) => {
              return (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  key={organisation.organisationId}
                  className="flex flex-col items-center justify-between gap-8 bg-neutral-100 px-6 py-8 rounded-[15px] w-full"
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
                        {organisation?.organisationName
                          .slice()[0]
                          ?.toUpperCase()}
                      </span>
                    )}
                    <span className="text-[1.6rem]">
                      {organisation.organisationName}
                    </span>
                  </div>
                  <div className="flex w-full gap-8">
                    <ButtonSecondary
                      onClick={() => cancelInviation(organisation)}
                      className="flex-1"
                    >
                      {isLoading ? <LoadingCircleSmall /> : t("back")}
                    </ButtonSecondary>
                    <ButtonPrimary
                      disabled={isLoading}
                      onClick={() => JoinOrganisation(organisation)}
                      className="flex-1"
                    >
                      {isLoading ? <LoadingCircleSmall /> : t("join")}
                    </ButtonPrimary>
                  </div>
                </motion.div>
              );
            })}
          </ul>
        </div>
      )}
      {createOrganisation && (
        <div className="flex flex-col items-center justify-between h-full pb-12 ">
          <div className=" flex flex-col justify-between h-full  gap-15 pt-16 w-full">
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
                className="font-primary text-center font-medium text-[1.5rem] leading-10 text-deep-100"
              >
                {t("alert")}
              </motion.p>
              {/* <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="font-primary text-center font-medium text-[1.5rem] leading-10 text-deep-100"
              >
                {t("alert2")}
              </motion.p> */}
              {/* <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="font-primary text-center font-medium text-[1.5rem] leading-10 text-deep-100"
              >
                {t("alert3")}
              </motion.p> */}
            </div>
            <div className="flex flex-col gap-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="w-full"
              >
                <LinkPrimary
                  href="/auth/onboarding/organisation"
                  className="w-full hidden lg:flex"
                >
                  {isLoading ? <LoadingCircleSmall /> : t("action")}
                </LinkPrimary>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="w-full pb-4"
              >
                <LinkSecondary
                  href={process.env.NEXT_PUBLIC_WEBSITE_URL!}
                  className="w-full hidden lg:flex justify-center items-center"
                >
                  {t("back")}
                </LinkSecondary>
              </motion.div>
            </div>
          </div>
          <div className="lg:hidden flex flex-col gap-8 w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="w-full lg:hidden"
            >
              <LinkPrimary
                href="/auth/onboarding/organisation"
                className="w-full lg:hidden"
              >
                {isLoading ? <LoadingCircleSmall /> : t("action")}
              </LinkPrimary>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="w-full lg:hidden"
            >
              <LinkSecondary
                href={process.env.NEXT_PUBLIC_WEBSITE_URL!}
                className="w-full flex justify-center items-center"
              >
                {t("back")}
              </LinkSecondary>
            </motion.div>
          </div>
        </div>
      )}

      {!createOrganisation && !invitedOrganisations && <LoadingCircleSmall />}
    </div>
  );
}
