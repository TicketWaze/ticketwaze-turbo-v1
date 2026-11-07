"use client";
import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { CloseCircle, InfoCircle, TickCircle } from "iconsax-reactjs";
import { Season, SeasonPassType } from "@ticketwaze/typescript-config";
import { useRouter } from "@/i18n/navigation";
import {
  CreateFooter,
  CreateHeader,
  CreatedScreen,
  Section,
} from "@/components/create/CreateParts";
import { Stagger } from "@/components/shared/motion";
import { Input } from "@/components/shared/Inputs";
import RichTextEditor from "@/components/shared/RichTextEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import countries from "@/lib/Countries";
import LocationPicker from "@/lib/LocationPicker";
import { slugify } from "@/lib/Slugify";
import useSeasonNameAvailability from "@/hooks/useSeasonNameAvailability";
import { CreateSeason, UpdateSeason } from "@/actions/SeasonActions";
import { SEASON_SPORTS } from "./SeasonChoice";

export { SEASON_SPORTS };

const NAME_MAX_CHARS = 150;

const selectTriggerClass =
  "bg-neutral-100 w-full rounded-[5rem] data-[size=default]:h-[6rem] shadow-none focus-visible:ring-0 focus-visible:border-primary-500 px-8 text-[1.5rem] leading-8 text-deep-200 outline-none border border-transparent focus:border-primary-500 data-[placeholder]:text-neutral-600";

/**
 * Rich text counts its markup. 150 visible characters, the same floor as an
 * event description, because each match starts from this text.
 */
const plainLength = (html: string) =>
  html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim().length;

function makeSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().trim().min(3, t("errors.name")),
    description: z
      .string()
      .refine((v) => plainLength(v) >= 150, t("errors.description")),
    sport: z.string().min(1, t("errors.sport")),
    competition: z.string().trim().min(2, t("errors.competition")),
    venueName: z.string().optional(),
    address: z.string().trim().min(2, t("errors.address")),
    country: z.string().min(2, t("errors.country")),
    state: z.string().min(2, t("errors.state")),
    city: z.string().min(2, t("errors.city")),
    // Required: every match starts from this pin, and an event needs one.
    location: z.object(
      { lat: z.number(), lng: z.number() },
      { error: t("errors.location") },
    ),
    // The season pass: one price, valid at every match, unlimited.
    passPrice: z
      .string()
      .refine(
        (v) => Number.isFinite(Number(v)) && Number(v) > 0,
        t("errors.pass_price"),
      ),
    passCurrency: z.enum(["HTG", "USD"]),
  });
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span className="text-[1.2rem] px-8 py-2 text-failure">{message}</span>
  );
}

/**
 * CREATE OR EDIT A SEASON: the wrapper around its matches, and the price of
 * the season pass that gets a buyer into every one of them. No cover: each
 * match has its own image. On create (reached from the Match card) the
 * success screen opens the first match's form.
 */
export default function SeasonForm({
  season,
  passType,
}: {
  season?: Season;
  /** The season's one pass, when editing: its price prefills the form. */
  passType?: SeasonPassType;
}) {
  const t = useTranslations("Events.season");
  const tCreated = useTranslations("Events.create_event.created");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const organisationId = session?.activeOrganisation?.organisationId;
  const isEdit = Boolean(season);

  const schema = makeSchema((k) => t(k));
  type TForm = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TForm>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      name: season?.name ?? "",
      description: season?.description ?? "",
      sport: season?.sport ?? "",
      competition: season?.competition ?? "",
      venueName: season?.venueName ?? "",
      address: season?.address ?? "",
      country: season?.country ?? "Haiti",
      state: season?.state ?? "",
      city: season?.city ?? "",
      location: season?.location ?? (undefined as unknown as TForm["location"]),
      passPrice: passType
        ? String(
            passType.currency === "USD"
              ? Number(passType.usdPrice)
              : Number(passType.price),
          )
        : "",
      passCurrency: passType?.currency ?? "HTG",
    },
  });

  const nameStatus = useSeasonNameAvailability(watch("name"), season?.seasonId);
  const country = watch("country");
  const state = watch("state");
  const states = countries.find((c) => c.name === country)?.state ?? [];
  const cities = states.find((s) => s.name === state)?.cities ?? [];

  const [created, setCreated] = useState(false);

  const onSubmit: SubmitHandler<TForm> = async (data) => {
    if (nameStatus === "taken") return;
    if (!organisationId) return;

    const fd = new FormData();
    fd.append("name", data.name.trim());
    fd.append("description", data.description);
    fd.append("sport", data.sport);
    fd.append("competition", data.competition.trim());
    if (data.venueName?.trim()) fd.append("venueName", data.venueName.trim());
    fd.append("address", data.address.trim());
    fd.append("country", data.country);
    fd.append("state", data.state);
    fd.append("city", data.city);
    fd.append("location", JSON.stringify(data.location));
    fd.append(
      "timezone",
      season?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
    fd.append("passPrice", String(Number(data.passPrice)));
    fd.append("passCurrency", data.passCurrency);

    try {
      const result = isEdit
        ? await UpdateSeason(organisationId, season!.seasonId, fd, locale)
        : await CreateSeason(organisationId, fd, locale);
      if (result.status !== "success") {
        toast.error(result.error);
        return;
      }
      const target = `/events/season/${slugify(result.season.name, result.season.seasonId)}`;
      if (isEdit) {
        toast.success(t("saved"));
        router.push(target);
        return;
      }
      // The organiser came from the Match card: straight on to that match.
      setCreated(true);
      setTimeout(() => router.push(`${target}/matches/new`), 1800);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : t("errors.submit_failed"),
      );
    }
  };

  if (created) {
    return (
      <CreatedScreen
        title={tCreated("season")}
        description={tCreated("description_activity")}
        pendingLabel={tCreated("opening_season")}
      />
    );
  }

  return (
    <div className="relative flex flex-col gap-10 h-full overflow-clip">
      <CreateHeader
        title={t(isEdit ? "edit_title" : "create_title")}
        onBack={() => router.back()}
        backLabel={t("back")}
      />

      <form
        id="season-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col gap-12 pb-28 lg:pb-8"
        noValidate
      >
        <Stagger>
          <div className="flex flex-col gap-12">
            <Section title={t("details")}>
              <Input
                {...register("name")}
                type="text"
                maxLength={NAME_MAX_CHARS}
                error={
                  errors.name?.message ??
                  (nameStatus === "taken" ? t("errors.name_taken") : undefined)
                }
                trailing={
                  nameStatus === "checking" ? (
                    <div className="w-8 h-8 border-3 border-t-primary-500 border-neutral-300 rounded-full animate-spin" />
                  ) : nameStatus === "available" ? (
                    <TickCircle size="20" color="#349C2E" variant="Bulk" />
                  ) : nameStatus === "taken" ? (
                    <CloseCircle size="20" color="#DE0028" variant="Bulk" />
                  ) : null
                }
              >
                {t("name")}
              </Input>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <Controller
                    control={control}
                    name="sport"
                    render={({ field }) => (
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className={selectTriggerClass}>
                          <SelectValue placeholder={t("sport_placeholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {SEASON_SPORTS.map((sport) => (
                            <SelectItem
                              key={sport}
                              value={sport}
                              className="text-[1.4rem] text-deep-100"
                            >
                              {t(`sports.${sport}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError message={errors.sport?.message} />
                </div>
                <div className="flex-1">
                  <Input
                    {...register("competition")}
                    type="text"
                    maxLength={150}
                    error={errors.competition?.message}
                  >
                    {t("competition")}
                  </Input>
                </div>
              </div>
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t("description_placeholder")}
                    error={errors.description?.message}
                  />
                )}
              />
            </Section>

            <Section title={t("venue")}>
              <p className="text-[1.3rem] leading-7 text-neutral-600 -mt-2">
                {t("venue_hint")}
              </p>
              <Input {...register("venueName")} type="text" maxLength={150}>
                {t("venue_name")}
              </Input>
              <Input
                {...register("address")}
                type="text"
                error={errors.address?.message}
              >
                {t("address")}
              </Input>
              <div>
                <Controller
                  control={control}
                  name="country"
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setValue("state", "");
                        setValue("city", "");
                      }}
                    >
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder={t("country")} />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem
                            key={c.name}
                            value={c.name}
                            className="text-[1.4rem] text-deep-100"
                          >
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError message={errors.country?.message} />
              </div>
              <div className="flex flex-col lg:flex-row w-full gap-6">
                <div className="flex-1">
                  <Controller
                    control={control}
                    name="state"
                    render={({ field }) => (
                      <Select
                        value={field.value || undefined}
                        disabled={!country}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setValue("city", "");
                        }}
                      >
                        <SelectTrigger className={selectTriggerClass}>
                          <SelectValue placeholder={t("state")} />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((s) => (
                            <SelectItem
                              key={s.name}
                              value={s.name}
                              className="text-[1.4rem] text-deep-100"
                            >
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError message={errors.state?.message} />
                </div>
                <div className="flex-1">
                  <Controller
                    control={control}
                    name="city"
                    render={({ field }) => (
                      <Select
                        value={field.value || undefined}
                        disabled={!state}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className={selectTriggerClass}>
                          <SelectValue placeholder={t("city")} />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem
                              key={city}
                              value={city}
                              className="text-[1.4rem] text-deep-100"
                            >
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError message={errors.city?.message} />
                </div>
              </div>
              <div>
                <LocationPicker
                  initialValue={season?.location ?? undefined}
                  onLocationSelect={(location) =>
                    setValue("location", location as TForm["location"], {
                      shouldValidate: true,
                    })
                  }
                />
                <FieldError message={errors.location?.message} />
              </div>
            </Section>

            <Section title={t("pass.title")}>
              <p className="text-[1.3rem] leading-7 text-neutral-600 -mt-2">
                {t("pass.hint")}
              </p>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <Input
                    {...register("passPrice")}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    error={errors.passPrice?.message}
                  >
                    {t("pass.price")}
                  </Input>
                </div>
                <div className="lg:w-[18rem]">
                  <Controller
                    control={control}
                    name="passCurrency"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          className={selectTriggerClass}
                          aria-label={t("pass.currency")}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(["HTG", "USD"] as const).map((currency) => (
                            <SelectItem
                              key={currency}
                              value={currency}
                              className="text-[1.4rem] text-deep-100"
                            >
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              {isEdit && (passType?.quantitySold ?? 0) > 0 && (
                <p className="text-[1.3rem] leading-7 text-neutral-600">
                  {t("pass.sold_note", { count: passType?.quantitySold ?? 0 })}
                </p>
              )}
            </Section>

            {!isEdit && (
              <Section>
                <div className="flex items-start gap-3 rounded-[12px] bg-primary-500/10 border border-primary-500/20 px-5 py-4">
                  <InfoCircle
                    size="20"
                    color="#E45B00"
                    variant="Bulk"
                    className="shrink-0 mt-[2px]"
                  />
                  <p className="text-[1.3rem] leading-7 text-neutral-700">
                    {t("review_note")}
                  </p>
                </div>
              </Section>
            )}
          </div>
        </Stagger>
      </form>

      <CreateFooter
        step={0}
        total={1}
        type="submit"
        formId="season-form"
        continueLabel={t(isEdit ? "save" : "submit")}
        loading={isSubmitting}
        disabled={nameStatus === "checking" || nameStatus === "taken"}
      />
    </div>
  );
}
