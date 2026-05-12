"use client";
import { UpdateOrganisationProfile } from "@/actions/organisationActions";
import PageLoader from "@/components/PageLoader";
import { ButtonPrimary } from "@/components/shared/buttons";
import { Input } from "@/components/shared/Inputs";
import Capitalize from "@/lib/Capitalize";
import { zodResolver } from "@hookform/resolvers/zod";
import { MembershipTier, Organisation } from "@ticketwaze/typescript-config";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import * as z from "zod";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoCircle } from "iconsax-reactjs";

export default function ProfileForm({
  authorized,
  organisation,
  membershipTier,
}: {
  authorized: boolean;
  organisation: Organisation;
  membershipTier: MembershipTier;
}) {
  const t = useTranslations("Settings.profile");
  const { data: session, update } = useSession();
  const locale = useLocale();

  const UpdateProfileSchema = z.object({
    organisationName: z
      .string()
      .min(1, t("errors.name.min"))
      .max(30, t("errors.name.max")),
    organisationDescription: z
      .string()
      .min(150, t("errors.description.min"))
      .max(350, t("errors.description.max")),
    organisationWebsite: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
  });

  type TUpdateProfileSchema = z.infer<typeof UpdateProfileSchema>;

  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<TUpdateProfileSchema>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      organisationName: organisation.organisationName ?? "",
      organisationDescription: organisation.organisationDescription ?? "",
      organisationWebsite: organisation.organisationWebsite ?? "",
      instagram: (organisation.socialLinks?.instagram as string) ?? "",
      twitter: (organisation.socialLinks?.twitter as string) ?? "",
    },
  });

  async function submitHandler(data: TUpdateProfileSchema) {
    const result = await UpdateOrganisationProfile(
      organisation.organisationId,
      data.organisationName,
      data.organisationDescription,
      session?.user.accessToken ?? "",
      locale,
      data.organisationWebsite,
      data.instagram ?? "",
      data.twitter ?? "",
    );
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(Capitalize(result.status ?? ""));
      reset(data);
      setSaved(true);
      if (result.organisation) {
        await update({
          ...session,
          activeOrganisation: {
            ...result.organisation,
          },
        });
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      id="profile-form"
      className={"flex flex-col gap-8"}
    >
      {isSubmitting && <PageLoader isLoading={isSubmitting} />}
      <span
        className={"pb-4 font-medium text-[1.8rem] leading-10 text-deep-100"}
      >
        {t("subtitle")}
      </span>
      <Input
        {...register("organisationName")}
        minLength={3}
        maxLength={30}
        error={errors.organisationName?.message}
        type="text"
        isLoading={isSubmitting}
        disabled={!authorized}
      >
        {t("placeholders.name")}
      </Input>
      <div>
        <textarea
          {...register("organisationDescription")}
          disabled={isSubmitting || !authorized}
          className={`bg-neutral-100 w-full rounded-4xl resize-none h-60 p-8 text-[1.5rem] leading-8 placeholder:text-neutral-600 text-deep-200 outline-none border disabled:text-neutral-600 disabled:cursor-not-allowed border-transparent focus:border-primary-500 {isLoading ? 'animate-pulse' : null}`}
          minLength={150}
          maxLength={350}
        />
        <span className={"text-[1.2rem] px-8 py-2 text-failure"}>
          {errors.organisationDescription?.message}
        </span>
      </div>
      <Input
        disabled={true}
        readOnly
        defaultValue={Capitalize(organisation.country ?? "")}
      >
        {t("placeholders.country")}
      </Input>
      <div className={"flex gap-6"}>
        <Input
          className="flex-1"
          disabled={true}
          readOnly
          defaultValue={organisation.state}
        >
          {t("placeholders.state")}
        </Input>
        <Input
          className="flex-1"
          disabled={true}
          readOnly
          defaultValue={organisation.city}
        >
          {t("placeholders.city")}
        </Input>
      </div>

      {/* Website */}
      <Input
        {...register("organisationWebsite")}
        type="url"
        error={errors.organisationWebsite?.message}
        isLoading={isSubmitting}
        disabled={!authorized}
        placeholder="https://yourwebsite.com"
      >
        {t("placeholders.website")}
      </Input>

      {/* Social links */}
      <div className="flex items-center gap-3">
        <span className={"font-medium text-[1.6rem] leading-10 text-deep-100"}>
          {t("placeholders.social_links")}
        </span>
        {membershipTier.membershipName !== "premium" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-pointer flex items-center">
                <InfoCircle size="18" color="#E45B00" variant="Bulk" />
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="max-w-[220px] text-[1.2rem] leading-6"
            >
              {t("placeholders.social_links_premium")}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex items-center bg-neutral-100 rounded-[100px] overflow-hidden border border-transparent focus-within:border-primary-500">
        <span className="pl-8 pr-3 text-[1.5rem] text-neutral-500 whitespace-nowrap select-none">
          instagram.com/
        </span>
        <input
          {...register("instagram")}
          type="text"
          disabled={!authorized || isSubmitting}
          placeholder={t("placeholders.instagram")}
          className="flex-1 bg-transparent py-6 pr-8 text-[1.5rem] leading-8 text-deep-200 outline-none disabled:text-neutral-600 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex items-center bg-neutral-100 rounded-[100px] overflow-hidden border border-transparent focus-within:border-primary-500">
        <span className="pl-8 pr-3 text-[1.5rem] text-neutral-500 whitespace-nowrap select-none">
          x.com/
        </span>
        <input
          {...register("twitter")}
          type="text"
          disabled={!authorized || isSubmitting}
          placeholder={t("placeholders.twitter")}
          className="flex-1 bg-transparent py-6 pr-8 text-[1.5rem] leading-8 text-deep-200 outline-none disabled:text-neutral-600 disabled:cursor-not-allowed"
        />
      </div>

      <div></div>
      {authorized && (
        <ButtonPrimary
          disabled={isSubmitting || (!isDirty && !saved)}
          type="submit"
        >
          {t("save")}
        </ButtonPrimary>
      )}
    </form>
  );
}
