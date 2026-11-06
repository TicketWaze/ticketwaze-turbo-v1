"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Season } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import Separator from "@/components/shared/Separator";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { ButtonNeutral, ButtonPrimary } from "@/components/shared/buttons";
import LocationPicker, {
  SelectedLocation,
} from "@/components/shared/LocationPicker";
import {
  ImageField,
  LABEL_CLASS,
  Section,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/shared/form/ActivityFormControls";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { UpdateSeasonAsAdminAction } from "@/actions/ActivityEdit";

/** Mirrors SEASON_SPORTS in the API's models/season. */
const SPORTS = [
  "football",
  "basketball",
  "volleyball",
  "baseball",
  "handball",
  "rugby",
  "boxing",
  "other",
] as const;

/**
 * ADMIN EDIT OF A SEASON — the organiser's own fields and rules (unique name,
 * 150+ character description, venue with a map pin, cover), applied at once
 * and emailed to the organiser. Same layout and confirm step as the other
 * activity edits. Matches keep their own dates, venue and tickets: those are
 * edited on each match's page.
 */
export default function EditSeasonForm({ season }: { season: Season }) {
  const t = useTranslations("Activities.edit");
  const ts = useTranslations("Activities.edit.season");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();

  const [name, setName] = useState(season.name ?? "");
  const [competition, setCompetition] = useState(season.competition ?? "");
  const [sport, setSport] = useState<string>(season.sport ?? "football");
  const [description, setDescription] = useState(season.description ?? "");
  const [cover, setCover] = useState<File | null>(null);
  const [venueName, setVenueName] = useState(season.venueName ?? "");
  const [address, setAddress] = useState(season.address ?? "");
  const [city, setCity] = useState(season.city ?? "");
  const [state, setState] = useState(season.state ?? "");
  const [country, setCountry] = useState(season.country ?? "");
  const [timezone, setTimezone] = useState(season.timezone ?? "");
  const [location, setLocation] = useState<SelectedLocation | null>(
    season.location ?? null,
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const detailHref = `/activities/season/${season.seasonId}`;

  const materialChanges = useMemo(
    () =>
      [
        name !== season.name && t("changes.name"),
        description !== season.description && t("changes.description"),
        Boolean(cover) && ts("changes.cover"),
        [venueName, address, city, state, country].join("|") !==
          [season.venueName ?? "", season.address, season.city, season.state, season.country].join("|") &&
          t("changes.venue"),
      ].filter(Boolean) as string[],
    [name, description, cover, venueName, address, city, state, country, season, t, ts],
  );

  function localProblems(): string[] {
    const problems: string[] = [];
    if (name.trim().length < 3) problems.push(t("errors.name"));
    if (competition.trim().length < 2) problems.push(ts("errors.competition"));
    if (description.trim().length < 150)
      problems.push(t("errors.description", { count: description.trim().length }));
    if ([address, city, state, country].some((v) => v.trim().length < 2))
      problems.push(t("errors.address"));
    if (!location) problems.push(ts("errors.location"));
    return problems;
  }

  function handleSubmitClick() {
    const problems = localProblems();
    if (problems.length > 0) {
      toast.error(problems[0]);
      return;
    }
    setConfirmOpen(true);
  }

  async function handleConfirmedSave() {
    setConfirmOpen(false);
    setIsSaving(true);
    setFieldErrors({});

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("competition", competition.trim());
    formData.append("sport", sport);
    formData.append("description", description.trim());
    if (venueName.trim()) formData.append("venueName", venueName.trim());
    formData.append("address", address.trim());
    formData.append("city", city.trim());
    formData.append("state", state.trim());
    formData.append("country", country.trim());
    if (timezone.trim()) formData.append("timezone", timezone.trim());
    if (location) formData.append("location", JSON.stringify(location));
    if (cover) formData.append("coverImage", cover);

    try {
      const result = await UpdateSeasonAsAdminAction({
        seasonId: season.seasonId,
        formData,
        accessToken: session?.user.accessToken ?? "",
        locale,
      });
      if ("error" in result) {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        toast.error(result.error);
        return;
      }
      toast.success(t("saved"));
      router.push(`/${locale}${detailHref}`);
      router.refresh();
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 flex-1 min-h-0 overflow-y-auto">
      <BackButton text={t("back")} />

      <div className="flex flex-col gap-2">
        <h2 className="font-primary leading-12 font-medium text-[2.6rem]">
          {ts("title")}
        </h2>
        <p className="text-[1.4rem] leading-8 text-neutral-600">
          {t("subtitle", { name: season.name })}
        </p>
      </div>

      <div className="rounded-[1.4rem] bg-orange-50 border border-orange-200 p-6 flex flex-col gap-2">
        <p className="text-[1.4rem] leading-8 text-orange-700 font-medium">
          {t("notice.title")}
        </p>
        <p className="text-[1.3rem] leading-8 text-orange-700">
          {ts("notice.matches")}
        </p>
      </div>

      <Section title={t("sections.details")}>
        <TextField
          label={ts("fields.name")}
          value={name}
          onChange={setName}
          error={fieldErrors.name}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TextField
            label={ts("fields.competition")}
            value={competition}
            onChange={setCompetition}
            error={fieldErrors.competition}
          />
          <SelectField
            label={ts("fields.sport")}
            value={sport}
            onChange={setSport}
            options={SPORTS.map((value) => ({ value, label: ts(`sports.${value}`) }))}
            error={fieldErrors.sport}
          />
        </div>
        <TextAreaField
          label={t("fields.description")}
          value={description}
          onChange={setDescription}
          error={fieldErrors.description}
          hint={t("fields.description_hint", { count: description.length })}
        />
        <ImageField
          label={ts("fields.cover")}
          file={cover}
          onChange={setCover}
          keepLabel={ts("fields.cover_keep")}
          replaceLabel={ts("fields.cover_new")}
        />
      </Section>

      <Separator />

      <Section title={t("sections.venue")}>
        <p className="text-[1.3rem] leading-8 text-neutral-600">{ts("venue_hint")}</p>
        <TextField
          label={ts("fields.venue_name")}
          value={venueName}
          onChange={setVenueName}
          error={fieldErrors.venueName}
        />
        <TextField
          label={t("fields.address")}
          value={address}
          onChange={setAddress}
          error={fieldErrors.address}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TextField label={t("fields.city")} value={city} onChange={setCity} error={fieldErrors.city} />
          <TextField label={t("fields.state")} value={state} onChange={setState} error={fieldErrors.state} />
          <TextField
            label={t("fields.country")}
            value={country}
            onChange={setCountry}
            error={fieldErrors.country}
          />
        </div>
        <TextField label={t("fields.timezone")} value={timezone} onChange={setTimezone} />
        <div>
          <span className={LABEL_CLASS}>{t("fields.map")}</span>
          <LocationPicker value={location} onChange={setLocation} />
        </div>
      </Section>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 pb-16">
        <ButtonNeutral className="w-full lg:flex-1" onClick={() => router.push(`/${locale}${detailHref}`)}>
          {t("actions.cancel")}
        </ButtonNeutral>
        <ButtonPrimary className="w-full lg:flex-1" disabled={isSaving} onClick={handleSubmitClick}>
          {isSaving ? <LoadingCircleSmall /> : t("actions.save")}
        </ButtonPrimary>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogTitle className="font-primary font-medium text-[2rem] leading-10 text-black">
            {t("confirm.title")}
          </DialogTitle>
          <div className="flex flex-col gap-4">
            <p className="text-[1.4rem] leading-8 text-neutral-600">
              {t("confirm.body", { name: season.name })}
            </p>
            {materialChanges.length > 0 && (
              <div className="rounded-[1.2rem] bg-neutral-100 p-4">
                <p className="text-[1.3rem] leading-8 text-neutral-700 font-medium">
                  {t("confirm.changing")}
                </p>
                <ul className="list-disc pl-8">
                  {materialChanges.map((change) => (
                    <li key={change} className="text-[1.3rem] leading-8 text-neutral-600">
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-6 pt-8">
            <DialogClose asChild>
              <ButtonNeutral className="flex-1">{t("actions.cancel")}</ButtonNeutral>
            </DialogClose>
            <ButtonPrimary className="flex-1" disabled={isSaving} onClick={handleConfirmedSave}>
              {isSaving ? <LoadingCircleSmall /> : t("confirm.cta")}
            </ButtonPrimary>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
