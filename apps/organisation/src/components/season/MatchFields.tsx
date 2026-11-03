"use client";
import { useTranslations } from "next-intl";
import { Gallery } from "iconsax-reactjs";
import { compressImage } from "@/lib/compressImage";
import TeamCrest from "./TeamCrest";

export type TeamSide = {
  name: string;
  /** A newly picked logo, uploaded on save. */
  logo: File | null;
  /** What is shown: the picked file's preview or the stored logo. */
  logoUrl: string | null;
  /** The stored logo was removed (edit only). */
  removed: boolean;
};

export type MatchFieldsValue = {
  home: TeamSide;
  away: TeamSide;
  round: string;
};

export type MatchFieldsErrors = { home?: string; away?: string };

export const emptyTeam = (logoUrl: string | null = null, name = ""): TeamSide => ({
  name,
  logo: null,
  logoUrl,
  removed: false,
});

/** The multipart fields the API reads, for create and edit alike. */
export function appendMatchFields(
  fd: FormData,
  value: MatchFieldsValue,
  { edit = false }: { edit?: boolean } = {},
) {
  fd.append("homeTeamName", value.home.name.trim());
  fd.append("awayTeamName", value.away.name.trim());
  fd.append("round", value.round.trim());
  if (value.home.logo) fd.append("homeTeamLogo", value.home.logo);
  if (value.away.logo) fd.append("awayTeamLogo", value.away.logo);
  if (edit) {
    if (value.home.removed && !value.home.logo) fd.append("removeHomeTeamLogo", "true");
    if (value.away.removed && !value.away.logo) fd.append("removeAwayTeamLogo", "true");
  }
}

export function validateMatchFields(
  value: MatchFieldsValue,
  t: (key: string) => string,
): MatchFieldsErrors {
  const errors: MatchFieldsErrors = {};
  if (!value.home.name.trim()) errors.home = t("errors.home");
  if (!value.away.name.trim()) errors.away = t("errors.away");
  return errors;
}

const inputClass =
  "bg-neutral-100 w-full rounded-[5rem] px-8 h-[6rem] text-[1.5rem] leading-8 placeholder:text-neutral-600 text-deep-200 outline-none border border-transparent focus:border-primary-500";

function TeamField({
  label,
  side,
  error,
  onChange,
}: {
  label: string;
  side: TeamSide;
  error?: string;
  onChange: (next: TeamSide) => void;
}) {
  const t = useTranslations("Events.season.match");

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const compressed = await compressImage(file);
    onChange({
      ...side,
      logo: compressed,
      logoUrl: URL.createObjectURL(compressed),
      removed: false,
    });
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-3">
      <span className="text-[1.4rem] font-medium text-neutral-700 px-2">
        {label}
      </span>
      <div className="flex items-center gap-4">
        <label className="relative cursor-pointer shrink-0 group" title={t("logo_add")}>
          {side.logoUrl ? (
            <TeamCrest name={side.name || "?"} logoUrl={side.logoUrl} size={60} />
          ) : (
            <span className="w-[60px] h-[60px] rounded-full border border-dashed border-neutral-300 bg-[#FBFBFB] flex items-center justify-center group-hover:border-primary-500 transition-colors">
              <Gallery size="22" color="#737c8a" variant="Bulk" />
            </span>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={pick}
            className="absolute inset-0 opacity-0 cursor-pointer"
            aria-label={side.logoUrl ? t("logo_change") : t("logo_add")}
          />
        </label>
        <input
          value={side.name}
          onChange={(e) => onChange({ ...side, name: e.target.value })}
          placeholder={t("team_placeholder")}
          maxLength={100}
          className={inputClass}
        />
      </div>
      <div className="flex items-center justify-between px-2 min-h-6">
        <span className="text-[1.2rem] text-failure">{error}</span>
        {side.logoUrl && (
          <button
            type="button"
            onClick={() =>
              onChange({ ...side, logo: null, logoUrl: null, removed: true })
            }
            className="text-[1.2rem] text-neutral-600 hover:text-failure cursor-pointer"
          >
            {t("logo_remove")}
          </button>
        )}
      </div>
    </div>
  );
}

/** Home team, away team (name + optional logo each) and the round. */
export default function MatchFields({
  value,
  onChange,
  errors = {},
}: {
  value: MatchFieldsValue;
  onChange: (next: MatchFieldsValue) => void;
  errors?: MatchFieldsErrors;
}) {
  const t = useTranslations("Events.season.match");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
        <TeamField
          label={t("home")}
          side={value.home}
          error={errors.home}
          onChange={(home) => onChange({ ...value, home })}
        />
        <span className="hidden lg:flex self-center pt-4 text-[1.4rem] font-primary font-bold text-neutral-500">
          {t("vs")}
        </span>
        <TeamField
          label={t("away")}
          side={value.away}
          error={errors.away}
          onChange={(away) => onChange({ ...value, away })}
        />
      </div>
      <div className="flex flex-col gap-3">
        <span className="text-[1.4rem] font-medium text-neutral-700 px-2">
          {t("round_optional")}
        </span>
        <input
          value={value.round}
          onChange={(e) => onChange({ ...value, round: e.target.value })}
          placeholder={t("round_placeholder")}
          maxLength={60}
          className={inputClass}
        />
      </div>
    </div>
  );
}
