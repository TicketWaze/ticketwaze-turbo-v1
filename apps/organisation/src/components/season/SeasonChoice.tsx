"use client";
import { useTranslations } from "next-intl";
import { Add, CloseCircle, TickCircle } from "iconsax-reactjs";
import { Season, SeasonSport } from "@ticketwaze/typescript-config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { EventNameAvailability } from "@/hooks/useEventNameAvailability";

export const SEASON_SPORTS: SeasonSport[] = [
  "football",
  "basketball",
  "volleyball",
  "baseball",
  "handball",
  "rugby",
  "boxing",
  "other",
];

/** Where a new match goes: on its own, into a season, or into a new one. */
export type SeasonChoiceValue =
  | { kind: "none" }
  | { kind: "existing"; seasonId: string }
  | {
      kind: "new";
      name: string;
      sport: SeasonSport | "";
      competition: string;
      passPrice: string;
      passCurrency: "HTG" | "USD";
    };

export type SeasonChoiceErrors = Partial<
  Record<"name" | "sport" | "competition" | "passPrice", string>
>;

export const newSeasonDraft = (): SeasonChoiceValue => ({
  kind: "new",
  name: "",
  sport: "football",
  competition: "",
  passPrice: "",
  passCurrency: "HTG",
});

export function validateSeasonChoice(
  value: SeasonChoiceValue,
  t: (key: string) => string,
  nameTaken: boolean,
): SeasonChoiceErrors {
  if (value.kind !== "new") return {};
  const errors: SeasonChoiceErrors = {};
  if (value.name.trim().length < 3) errors.name = t("errors.name");
  else if (nameTaken) errors.name = t("errors.name_taken");
  if (!value.sport) errors.sport = t("errors.sport");
  if (value.competition.trim().length < 2)
    errors.competition = t("errors.competition");
  const price = Number(value.passPrice);
  if (!value.passPrice || !Number.isFinite(price) || price <= 0)
    errors.passPrice = t("errors.pass_price");
  return errors;
}

const inputClass =
  "bg-neutral-100 w-full rounded-[5rem] px-8 h-[6rem] text-[1.5rem] leading-8 placeholder:text-neutral-600 text-deep-200 outline-none border border-transparent focus:border-primary-500";
const selectTriggerClass =
  "bg-neutral-100 w-full rounded-[5rem] data-[size=default]:h-[6rem] shadow-none focus-visible:ring-0 focus-visible:border-primary-500 px-8 text-[1.5rem] leading-8 text-deep-200 outline-none border border-transparent focus:border-primary-500 data-[placeholder]:text-neutral-600";

function Error({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span className="text-[1.2rem] px-8 pt-2 text-failure">{message}</span>
  );
}

function Option({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex items-center gap-2 rounded-[3rem] border px-6 py-3 text-[1.4rem] leading-7 cursor-pointer transition-colors max-w-full",
        selected
          ? "border-primary-500 bg-primary-50 text-primary-500"
          : "border-neutral-200 text-neutral-700 hover:border-neutral-300",
      )}
    >
      {children}
    </button>
  );
}

/**
 * "Add this match to a season?" — optional. A match can stand alone; joining
 * a season lets fans buy one pass for all its matches. A NEW season needs its
 * name, competition and pass price here, and a second match before anything
 * is saved (the wizard adds that step).
 */
export default function SeasonChoice({
  seasons,
  value,
  onChange,
  errors = {},
  nameStatus,
}: {
  seasons: Season[];
  value: SeasonChoiceValue;
  onChange: (next: SeasonChoiceValue) => void;
  errors?: SeasonChoiceErrors;
  /** The new season's name check (useSeasonNameAvailability, in the wizard). */
  nameStatus: EventNameAvailability;
}) {
  const t = useTranslations("Events.season");

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[1.3rem] leading-7 text-neutral-600 -mt-2">
        {t("choice.hint")}
      </p>
      <div className="flex flex-wrap gap-3">
        <Option
          selected={value.kind === "none"}
          onClick={() => onChange({ kind: "none" })}
        >
          {t("choice.none")}
        </Option>
        {seasons.map((season) => (
          <Option
            key={season.seasonId}
            selected={
              value.kind === "existing" && value.seasonId === season.seasonId
            }
            onClick={() =>
              onChange({ kind: "existing", seasonId: season.seasonId })
            }
          >
            <span className="truncate">{season.name}</span>
          </Option>
        ))}
        <Option
          selected={value.kind === "new"}
          onClick={() => value.kind !== "new" && onChange(newSeasonDraft())}
        >
          <Add size="18" color="currentColor" aria-hidden />
          {t("choice.new")}
        </Option>
      </div>

      {value.kind === "new" && (
        <div className="flex flex-col gap-6 rounded-[1.5rem] bg-neutral-50 p-6">
          <p className="text-[1.3rem] leading-7 text-neutral-700">
            {t("choice.new_hint")}
          </p>
          <div>
            <div className="relative">
              <input
                value={value.name}
                onChange={(e) => onChange({ ...value, name: e.target.value })}
                placeholder={t("name")}
                aria-label={t("name")}
                maxLength={150}
                className={inputClass}
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 flex">
                {nameStatus === "checking" ? (
                  <span className="w-8 h-8 border-3 border-t-primary-500 border-neutral-300 rounded-full animate-spin" />
                ) : nameStatus === "available" ? (
                  <TickCircle size="20" color="#349C2E" variant="Bulk" />
                ) : nameStatus === "taken" ? (
                  <CloseCircle size="20" color="#DE0028" variant="Bulk" />
                ) : null}
              </span>
            </div>
            <Error
              message={
                errors.name ??
                (nameStatus === "taken" ? t("errors.name_taken") : undefined)
              }
            />
          </div>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <Select
                value={value.sport || undefined}
                onValueChange={(sport) =>
                  onChange({ ...value, sport: sport as SeasonSport })
                }
              >
                <SelectTrigger
                  className={selectTriggerClass}
                  aria-label={t("sport")}
                >
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
              <Error message={errors.sport} />
            </div>
            <div className="flex-1">
              <input
                value={value.competition}
                onChange={(e) =>
                  onChange({ ...value, competition: e.target.value })
                }
                placeholder={t("competition")}
                aria-label={t("competition")}
                maxLength={150}
                className={inputClass}
              />
              <Error message={errors.competition} />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[1.4rem] font-medium text-neutral-700 px-2">
              {t("pass.title")}
            </span>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <input
                  value={value.passPrice}
                  onChange={(e) =>
                    onChange({ ...value, passPrice: e.target.value })
                  }
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  placeholder={t("pass.price")}
                  aria-label={t("pass.price")}
                  className={inputClass}
                />
                <Error message={errors.passPrice} />
              </div>
              <div className="lg:w-[16rem]">
                <Select
                  value={value.passCurrency}
                  onValueChange={(currency) =>
                    onChange({
                      ...value,
                      passCurrency: currency as "HTG" | "USD",
                    })
                  }
                >
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
              </div>
            </div>
            <span className="text-[1.2rem] leading-6 text-neutral-600 px-2">
              {t("pass.hint")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
